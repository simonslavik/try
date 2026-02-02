"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.metricsEndpoint = exports.metricsMiddleware = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a Registry to register metrics
const register = new prom_client_1.default.Registry();
exports.register = register;
// Add default metrics (CPU, memory, etc.)
prom_client_1.default.collectDefaultMetrics({ register });
// Custom metrics
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});
const httpRequestTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});
const activeConnections = new prom_client_1.default.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});
// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
/**
 * Middleware to track HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    activeConnections.inc();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode
        };
        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);
        activeConnections.dec();
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
/**
 * Endpoint to expose metrics for Prometheus
 */
const metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
};
exports.metricsEndpoint = metricsEndpoint;
