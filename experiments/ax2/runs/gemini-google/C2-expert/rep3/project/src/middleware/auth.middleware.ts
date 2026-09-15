import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { verifyToken } from '../utils/jwt.util';

/**
 * Extracts token from Authorization header.
 * Supports both "Token <token>" (Conduit spec) and "Bearer <token>".
 *
 * @param {Request} req Express request
 * @returns {string | null} Extracted token or null
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
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
 * Middleware requiring a valid JWT authentication token.
 *
 * @param {Request} req Express request
 * @param {Response} _res Express response
 * @param {NextFunction} next Express next function
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware that optionally attaches authenticated user if a valid token is provided.
 * Does not fail if token is absent.
 *
 * @param {Request} req Express request
 * @param {Response} _res Express response
 * @param {NextFunction} next Express next function
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
    next();
  } catch {
    // Optional auth does not reject if token is invalid or expired
    next();
  }
}
