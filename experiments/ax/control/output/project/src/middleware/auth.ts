import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    res.status(401).json({ errors: { body: ['Unauthorized'] } });
    return;
  }

  const token = authHeader.substring(6);

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ errors: { body: ['Invalid or expired token'] } });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    next();
    return;
  }

  const token = authHeader.substring(6);

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
  } catch (error) {
    // Ignore invalid token for optional auth
  }

  next();
}
