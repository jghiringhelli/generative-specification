// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import { UnauthorizedError } from '../errors/AppError';

export interface AuthUserPayload {
  id: string;
  email: string;
  username: string;
  token: string;
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
    return next(new UnauthorizedError('Missing or invalid authorization token'));
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      token
    };
    next();
  } catch (_err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      token
    };
  } catch (_err) {
    // Optional auth silently ignores invalid tokens
  }
  next();
}
