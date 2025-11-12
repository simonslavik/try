import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js'

const authHandler = (req: Request, res: Response, next: NextFunction) => {
    const authHandler = req.headers['authorization'];
    const token = authHandler && authHandler?.split(" ")[1];

    if (!token) {
        logger.warn('Not valid token provided');
        return res.status(401).json({ message: 'Authorization required', success: false });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
            logger.warn('Token verification failed');
            return res.status(403).json({ message: 'Invalid token', success: false });
        }
        (req as any).user = user;
        next();
    });
}