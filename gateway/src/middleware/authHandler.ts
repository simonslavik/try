import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authHandler = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader?.split(" ")[1];

    if (!token) {
        logger.warn('No authorization token provided while requesting protected route');
        return res.status(401).json({ message: 'Authorization required', success: false });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        logger.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error', success: false });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            logger.warn("Invalid token!");
            return res.status(403).json({
                message: "Invalid token!",
                success: false,
            });
        }

        req.user = user;
        next();
    });
};

export default authHandler;