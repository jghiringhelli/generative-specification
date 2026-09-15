import { NextFunction, Request, Response } from 'express';
import pkg, { JwtPayload } from 'jsonwebtoken';
import { loadConfig } from '../config/env';
import { UnauthorizedError } from '../errors/AppError';

const { verify } = pkg;

/**
 * Extract a JWT from the Authorization header, supporting `Token` and `Bearer` schemes.
 * @param header - The raw Authorization header value.
 * @returns The token string, or null if absent/malformed.
 */
function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (!token || (scheme !== 'Token' && scheme !== 'Bearer')) {
    return null;
  }
  return token;
}

/**
 * Verify a token and return the embedded user id.
 * @param token - The JWT string.
 * @returns The decoded user id.
 */
function decodeUserId(token: string): number {
  const { jwtSecret } = loadConfig();
  const payload = verify(token, jwtSecret) as JwtPayload;
  if (typeof payload.id !== 'number') {
    throw new UnauthorizedError('Invalid token');
  }
  return payload.id;
}

/**
 * Require a valid JWT; attaches `req.userId` or rejects with 401.
 * @param req - Express request.
 * @param _res - Express response (unused).
 * @param next - Express next handler.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('authorization'));
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }
  try {
    req.userId = decodeUserId(token);
  } catch {
    throw new UnauthorizedError('Invalid token');
  }
  next();
}

/**
 * Attach `req.userId` when a valid JWT is present; otherwise continue anonymously.
 * @param req - Express request.
 * @param _res - Express response (unused).
 * @param next - Express next handler.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.header('authorization'));
  if (token) {
    try {
      req.userId = decodeUserId(token);
    } catch {
      req.userId = undefined;
    }
  }
  next();
}
