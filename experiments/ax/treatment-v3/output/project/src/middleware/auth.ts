import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError } from '../errors/AppError';
import { JwtPayload } from '../types/jwt';

/**
 * JWT authentication middleware.
 * Verifies "Authorization: Token <jwt>" header per RealWorld spec.
 * Attaches decoded userId to req.user.
 * Throws AuthenticationError on missing/invalid token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Token') {
    throw new AuthenticationError('Invalid authorization header format. Expected: "Token <jwt>"');
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Optional authentication middleware.
 * Attaches req.user if valid token present, but does not throw if missing.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Token') {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(parts[1], env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch {
    // Invalid token - continue without user (same as no token)
  }

  next();
}
