import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/AppError';
import { verifyToken } from '../utils/jwt';

/**
 * Extract token from Authorization header.
 * RealWorld spec format: "Token jwt.token.here" (not Bearer)
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
 * Authentication middleware (required).
 * Verifies JWT token and attaches user to request.
 * @throws AuthenticationError if token missing or invalid
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    throw new AuthenticationError('No authorization token provided');
  }

  const payload = verifyToken(token);
  
  req.user = {
    id: payload.userId,
    email: '',
    username: ''
  };

  next();
}

/**
 * Optional authentication middleware.
 * Attaches user to request if token present and valid, but doesn't fail if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: '',
      username: ''
    };
  } catch (error) {
    // Invalid token in optional auth context - ignore and continue
  }

  next();
}
