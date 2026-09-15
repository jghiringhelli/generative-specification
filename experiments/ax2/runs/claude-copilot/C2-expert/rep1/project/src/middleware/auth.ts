import { Request, Response, NextFunction } from 'express';
import { loadConfig } from '../config/env';
import { verifyToken, TokenPayload } from '../lib/auth';
import { UnauthorizedError } from '../lib/errors';

/** Express request augmented with the authenticated user identity. */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Extracts a bearer/token credential from the Authorization header.
 * RealWorld uses the "Token <jwt>" scheme; "Bearer <jwt>" is also accepted.
 * @param header the raw Authorization header value
 * @returns the token string, or null when absent/malformed
 */
function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (!value || (scheme !== 'Token' && scheme !== 'Bearer')) return null;
  return value;
}

/**
 * Middleware that requires a valid JWT. Populates req.user or fails with 401.
 * @param req the incoming request
 * @param _res the response (unused)
 * @param next the next handler
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next(new UnauthorizedError('Authentication token required'));
    return;
  }
  try {
    req.user = verifyToken(token, loadConfig().jwtSecret);
    next();
  } catch {
    next(new UnauthorizedError('Invalid authentication token'));
  }
}

/**
 * Middleware that populates req.user when a valid token is present but never fails.
 * @param req the incoming request
 * @param _res the response (unused)
 * @param next the next handler
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (token) {
    try {
      req.user = verifyToken(token, loadConfig().jwtSecret);
    } catch {
      // Ignore invalid tokens for optional auth routes.
    }
  }
  next();
}
