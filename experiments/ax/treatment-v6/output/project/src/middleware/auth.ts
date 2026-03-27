import type { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';

/** Payload structure stored inside a JWT token. */
interface JwtPayload {
  readonly userId: number;
}

/**
 * Middleware that validates the Authorization: Token <jwt> header.
 * Sets req.userId on success. Throws UnauthorizedError if token is missing or invalid.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Token ')) {
    next(new UnauthorizedError('Authorization header missing or malformed'));
    return;
  }

  const token = authHeader.slice(6);
  try {
    const payload = verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Middleware that optionally decodes the Authorization header.
 * Sets req.userId if a valid token is present; does NOT throw if absent.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Token ')) {
    next();
    return;
  }

  const token = authHeader.slice(6);
  try {
    const payload = verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
  } catch {
    // Token present but invalid — proceed without userId (unauthenticated)
  }
  next();
}
