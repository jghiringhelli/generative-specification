import { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { config } from '../config/env';
import { AuthenticatedUser } from '../types/express';

const { verify } = pkg;

function extractToken(req: Request): string | null {
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

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  try {
    const decoded = verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
  } catch (_err) {
    req.user = undefined;
  }

  next();
}
