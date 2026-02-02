"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_loki_1 = __importDefault(require("winston-loki"));
const isDevelopment = process.env.NODE_ENV !== 'production';
const LOKI_HOST = process.env.LOKI_HOST || 'http://loki:3100';
const transports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => {
            const { timestamp, level, message, service, ...meta } = info;
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        }))
    })
];
// Add Loki transport in production or when LOKI_HOST is set
if (!isDevelopment || process.env.LOKI_HOST) {
    transports.push(new winston_loki_1.default({
        host: LOKI_HOST,
        labels: { service: 'books-service' },
        json: true,
        format: winston_1.default.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => {
            console.error('Loki connection error:', err);
        }
    }));
}
const logger = winston_1.default.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    defaultMeta: { service: 'books-service' },
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports
});
exports.default = logger;
