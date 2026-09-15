import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/token';
import { UnauthorizedError } from '../errors';

/** Express request augmented with the authenticated user id. */
export interface AuthenticatedRequest extends Request {
  userId?: number;
  username?: string;
}

const TOKEN_SCHEME = 'Token';

function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== TOKEN_SCHEME || !token) {
    return null;
  }
  return token;
}

/**
 * Builds middleware that requires a valid JWT and attaches the user id.
 * @param jwtSecret The signing secret used to verify tokens.
 * @returns Express middleware enforcing authentication.
 */
export function requireAuth(jwtSecret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      next(new UnauthorizedError('authentication token required'));
      return;
    }
    try {
      const payload = verifyToken(token, jwtSecret);
      req.userId = payload.id;
      req.username = payload.username;
      next();
    } catch {
      next(new UnauthorizedError('invalid authentication token'));
    }
  };
}

/**
 * Builds middleware that attaches the user id when a valid token is present but
 * never rejects the request when it is absent or invalid.
 * @param jwtSecret The signing secret used to verify tokens.
 * @returns Express middleware performing optional authentication.
 */
export function optionalAuth(jwtSecret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      next();
      return;
    }
    try {
      const payload = verifyToken(token, jwtSecret);
      req.userId = payload.id;
      req.username = payload.username;
    } catch {
      // Ignore invalid tokens for optional authentication.
    }
    next();
  };
}
