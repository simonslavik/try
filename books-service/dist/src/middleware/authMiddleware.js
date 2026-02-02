"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to verify JWT access token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to req.user if valid
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'No authorization token provided'
            });
        }
        // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: 'Invalid authorization format. Expected: Bearer <token>'
            });
        }
        const token = parts[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user'
        };
        // Continue to next middleware/controller
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired. Please refresh your token.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token'
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            message: 'Authentication error',
            error: error.message
        });
    }
};
exports.authMiddleware = authMiddleware;
