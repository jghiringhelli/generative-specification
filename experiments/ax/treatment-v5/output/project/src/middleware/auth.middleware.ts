
/**
 * Authentication middleware.
 * Verifies JWT token and attaches user ID to request.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors/AppError';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
    }
  }
}

/**
 * Extract token from Authorization header.
 * Expected format: "Token <jwt>"
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Token') {
    return null;
  }

  return parts[1];
}

/**
 * Auth middleware — requires valid JWT.
 * Attaches decoded userId to req.user.
 * @throws UnauthorizedError if token is missing or invalid
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError('missing authorization token');
  }

  const payload = verifyToken(token);
  req.user = { userId: payload.userId };

  next();
}

/**
 * Optional auth middleware.
 * Attaches userId to req.user if token is present and valid.
 * Does NOT throw if token is missing — allows anonymous access.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { userId: payload.userId };
    } catch {
      // Invalid token — treat as anonymous
      req.user = undefined;
    }
  }

  next();
}
