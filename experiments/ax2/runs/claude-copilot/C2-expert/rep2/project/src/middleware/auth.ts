import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const TOKEN_SCHEME = 'Token';

function extractToken(header?: string): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (scheme !== TOKEN_SCHEME || !value) {
    return null;
  }
  return value;
}

/**
 * Requires a valid JWT. Populates `req.user` or rejects with 401.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('authorization'));
  if (!token) {
    return next(new UnauthorizedError('missing authentication token'));
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError('invalid authentication token'));
  }
}

/**
 * Populates `req.user` when a valid token is present but never rejects.
 * Used by endpoints whose response varies for authenticated users.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('authorization'));
  if (!token) {
    return next();
  }
  try {
    req.user = verifyToken(token);
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}
