"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const metrics_1 = require("./middleware/metrics");
const redis_1 = require("./config/redis");
const bookSearchRoutes_1 = __importDefault(require("./routes/bookSearchRoutes"));
const userBooksRoutes_1 = __importDefault(require("./routes/userBooksRoutes"));
const bookClubBooksRoutes_1 = __importDefault(require("./routes/bookClubBooksRoutes"));
const readingProgressRoutes_1 = __importDefault(require("./routes/readingProgressRoutes"));
const bookSuggestionsRoutes_1 = __importDefault(require("./routes/bookSuggestionsRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Metrics middleware
app.use(metrics_1.metricsMiddleware);
// Request logging middleware
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'books-service',
        timestamp: new Date().toISOString(),
    });
});
// Metrics endpoint for Prometheus
app.get('/metrics', metrics_1.metricsEndpoint);
// API Routes
app.use('/v1/books', bookSearchRoutes_1.default);
app.use('/v1/user-books', userBooksRoutes_1.default);
app.use('/v1/bookclub', bookClubBooksRoutes_1.default);
app.use('/v1/bookclub-books', readingProgressRoutes_1.default);
app.use('/v1/bookclub', bookSuggestionsRoutes_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_1.default);
// Initialize Redis connection
(0, redis_1.connectRedis)().catch((_error) => {
    logger_1.default.warn('Books service starting without Redis cache');
});
// Start server
app.listen(PORT, () => {
    logger_1.default.info(`📚 Books service running on http://localhost:${PORT}`);
});
