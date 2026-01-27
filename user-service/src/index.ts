import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/userRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import logger from './utils/logger.js';
import validateEnv from './utils/envValidator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables before starting the server
try {
    validateEnv();
} catch (error) {
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable CSP for now to allow image loading
})); // Security headers


app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.path 
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 User Service running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

// Catch unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
