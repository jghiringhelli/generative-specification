import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../utils/error.util';

/**
 * Extracts JWT token string from the Authorization header.
 * Supports both "Token <jwt>" (RealWorld standard) and "Bearer <jwt>".
 *
 * @param {Request} req - Incoming Express request
 * @returns {string | null} Extracted token or null if not provided
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }

  return null;
}

/**
 * Middleware requiring a valid JWT token.
 * Rejects requests with 401 Unauthorized if token is missing or invalid.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorizedError('Authentication token is required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that optionally decodes a JWT token if present.
 * Does not block unauthenticated requests.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch {
    // If token is invalid, treat request as unauthenticated
    req.user = undefined;
  }
  next();
}
