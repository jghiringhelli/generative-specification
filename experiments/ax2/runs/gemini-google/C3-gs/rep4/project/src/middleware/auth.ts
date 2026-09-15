import { Request, Response, NextFunction } from 'express';
import pkg, { JwtPayload } from 'jsonwebtoken';
const { verify } = pkg;
import { UnauthorizedError } from '../errors/AppError';

export interface AuthenticatedUser {
  id: string;
  username: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  return null;
}

export function authOptional(req: RequestWithUser, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = verify(token, secret) as JwtPayload;
    if (decoded && typeof decoded === 'object' && decoded.id && decoded.username) {
      req.user = {
        id: decoded.id as string,
        username: decoded.username as string
      };
    }
  } catch {
    req.user = undefined;
  }
  next();
}

export function authRequired(req: RequestWithUser, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = verify(token, secret) as JwtPayload;
    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.username) {
      return next(new UnauthorizedError('Invalid token'));
    }
    req.user = {
      id: decoded.id as string,
      username: decoded.username as string
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
