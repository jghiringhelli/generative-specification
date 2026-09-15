import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';
import { UnauthorizedError } from '../errors/AppError';

/** Express request augmented with the authenticated user id. */
export interface AuthedRequest extends Request {
  userId?: number;
}

/**
 * Extract a bearer token from the RealWorld `Authorization: Token <jwt>` header.
 * Also accepts the `Bearer` scheme for compatibility.
 * @param header - The raw Authorization header value.
 * @returns The token string, or null if absent/malformed.
 */
function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if ((scheme === 'Token' || scheme === 'Bearer') && value) {
    return value;
  }
  return null;
}

/**
 * Build middleware that requires a valid JWT and sets `req.userId`.
 * @param secret - The JWT verification secret.
 * @returns Express middleware enforcing authentication.
 */
export function requireAuth(secret: string) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.header('authorization'));
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    try {
      const payload = verifyToken(token, secret);
      req.userId = payload.userId;
      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}

/**
 * Build middleware that sets `req.userId` when a valid token is present but
 * never rejects the request when it is absent or invalid.
 * @param secret - The JWT verification secret.
 * @returns Express middleware for optional authentication.
 */
export function optionalAuth(secret: string) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.header('authorization'));
    if (token) {
      try {
        req.userId = verifyToken(token, secret).userId;
      } catch {
        // Ignore invalid tokens for optional auth.
      }
    }
    next();
  };
}
