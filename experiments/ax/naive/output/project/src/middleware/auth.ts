import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Token ')) {
      throw new UnauthorizedError();
    }

    const token = authHeader.substring(6);
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    next(new UnauthorizedError());
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Token ')) {
      const token = authHeader.substring(6);
      const { userId } = verifyToken(token);
      req.userId = userId;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next();
}
