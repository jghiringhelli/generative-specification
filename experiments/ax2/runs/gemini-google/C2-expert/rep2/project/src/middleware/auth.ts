import { Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { formatErrorResponse } from '../lib/errors';
import { RequestWithUser } from '../types';

/**
 * Extracts JWT token from Authorization header (supports "Token <jwt>" and "Bearer <jwt>").
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  return null;
}

/**
 * Middleware that requires a valid JWT token.
 */
export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json(formatErrorResponse('Unauthorized: missing or invalid token'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(formatErrorResponse('Unauthorized: invalid token'));
  }
}

/**
 * Middleware that optionally attaches user payload if token is present and valid.
 */
export function optionalAuth(req: RequestWithUser, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    req.user = payload;
  } catch {
    // If token is invalid or expired, continue as unauthenticated
  }
  next();
}
