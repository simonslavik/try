import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';
import { setupProxyRoutes } from './routes/proxyRoutes.js';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch((err) => {
  logger.error('Could not connect to Redis', err);
});

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Add request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json());

const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests, please try again later" });
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args) as any,
  }),
});

app.use(ratelimitOptions);

app.use((req: Request, res: Response, next: NextFunction) => {
  // Don't log sensitive fields
  const sanitizedBody = { ...req.body };
  delete sanitizedBody.password;
  delete sanitizedBody.creditCard;
  delete sanitizedBody.token;
  
  const requestId = (req as any).id || 'unknown';
  logger.info(`[${requestId}] ${req.method} ${req.url}`);
  if (Object.keys(sanitizedBody).length > 0) {
    logger.info(`[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-gateway'
  });
});

// Setup proxy routes for all microservices
setupProxyRoutes(app);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Gateway is running on port ${PORT}`);
});