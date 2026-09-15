// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { UnauthorizedError } from '../errors/AppError';

const { verify } = pkg;

export interface AuthUserPayload {
  id: string;
  username: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

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
    return next(new UnauthorizedError('Authentication token required'));
  }

  try {
    const decoded = verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    return next();
  } catch (_err) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
  } catch (_err) {
    // In optionalAuth, invalid token simply means unauthenticated request
  }
  return next();
}
