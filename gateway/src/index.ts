import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import proxy from 'express-http-proxy';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch((err) => {
  logger.error('Could not connect to Redis', err);
});



dotenv.config();

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args) as Promise<any>,
  }),
});

app.use(ratelimitOptions);

app.use((req: Request, res: Response, next: NextFunction) => {
  // Don't log sensitive fields
  const sanitizedBody = { ...req.body };
  delete sanitizedBody.password;
  delete sanitizedBody.creditCard;
  delete sanitizedBody.token;
  
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${JSON.stringify(sanitizedBody)}`);
  next();
});


const proxyOptions = {
  proxyReqPathResolver: (req: Request) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};


app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Gateway is running on port ${PORT}`);
});