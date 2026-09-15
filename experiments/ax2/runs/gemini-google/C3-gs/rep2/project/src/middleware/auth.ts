import { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

const { verify } = pkg;

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Extracts raw JWT token string from Authorization header.
 * Supports both "Token <jwt>" (RealWorld standard) and "Bearer <jwt>".
 * @param authHeader The raw header value.
 * @returns Extracted token string or null if not found.
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  return null;
}

/**
 * Middleware that strictly enforces JWT authentication.
 */
export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('Authorization'));
  if (!token) {
    return next(new UnauthorizedError('Authentication token is required'));
  }

  const secret = process.env.JWT_SECRET || 'secret-jwt-key';

  try {
    const decoded = verify(token, secret) as AuthenticatedUserPayload;
    req.user = { id: decoded.id, username: decoded.username };
    return next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Middleware that optionally decodes JWT token if provided, but does not block if absent.
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('Authorization'));
  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET || 'secret-jwt-key';

  try {
    const decoded = verify(token, secret) as AuthenticatedUserPayload;
    req.user = { id: decoded.id, username: decoded.username };
  } catch (error) {
    // Optional auth silently ignores invalid tokens
    req.user = undefined;
  }

  return next();
}
