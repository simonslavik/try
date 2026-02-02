"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    logger_1.default.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(!isProduction && err.stack && { stack: err.stack })
    });
};
exports.default = errorHandler;
