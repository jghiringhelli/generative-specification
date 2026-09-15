import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../modules/users/auth.utils';
import { UnauthorizedError } from '../errors/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const match = authHeader.match(/^(?:Token|Bearer)\s+(.*)$/i);
  return match ? match[1] : null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Authentication token is required'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch (_error) {
    // If token is invalid in optional auth, proceed without authenticated user
  }
  next();
}
