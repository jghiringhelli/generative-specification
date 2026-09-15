import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/http-error';
import { verifyToken, TokenPayload } from '../utils/security';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Extracts and verifies the token from the Authorization header.
 *
 * @param {string | undefined} authHeader - Raw Authorization header value
 * @returns {TokenPayload | null} Decoded payload or null if absent/invalid
 */
function extractTokenPayload(authHeader: string | undefined): TokenPayload | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (scheme !== 'Token' && scheme !== 'Bearer') {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Middleware requiring a valid JWT token.
 *
 * @param {AuthenticatedRequest} req - Express request
 * @param {Response} _res - Express response
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const payload = extractTokenPayload(req.header('Authorization'));
  if (!payload) {
    next(new UnauthorizedError('Authentication token is missing or invalid'));
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware that parses the JWT token if present, but does not enforce authentication.
 *
 * @param {AuthenticatedRequest} req - Express request
 * @param {Response} _res - Express response
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const payload = extractTokenPayload(req.header('Authorization'));
  if (payload) {
    req.user = payload;
  }
  next();
}
