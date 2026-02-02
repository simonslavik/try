"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * General rate limiter for all routes
 * 100 requests per 15 minutes per IP
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Search API rate limiter
 * 30 requests per minute per IP
 */
exports.searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: {
        error: 'Too many search requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
