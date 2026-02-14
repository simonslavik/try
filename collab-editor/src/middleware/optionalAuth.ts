import { Request, Response, NextFunction } from 'express';

/**
 * Optional authentication middleware — trusts x-user-id header from the API gateway.
 * Attaches user info if present, but doesn't reject if missing.
 * Used for public endpoints that benefit from knowing who the user is.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userName = req.headers['x-user-name'] as string;

  if (userId) {
    (req as any).user = {
      userId,
      email: userEmail || '',
      name: userName || undefined
    };
  }

  next();
};
