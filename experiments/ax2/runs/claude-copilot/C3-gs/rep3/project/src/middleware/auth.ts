import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';
import { UnauthorizedError } from '../errors/AppError';
import { AppConfig } from '../config/config';

const TOKEN_PREFIXES = ['Token', 'Bearer'];

function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (value && TOKEN_PREFIXES.includes(scheme)) {
    return value;
  }
  return null;
}

/** Require a valid token; rejects with 401 when absent or invalid. */
export function requireAuth(config: AppConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.header('authorization'));
    if (!token) {
      throw new UnauthorizedError('Missing authentication token');
    }
    try {
      const payload = verifyToken(token, config.jwtSecret);
      req.userId = payload.id;
      next();
    } catch {
      throw new UnauthorizedError('Invalid authentication token');
    }
  };
}

/** Populate userId when a valid token is present; otherwise continue anonymously. */
export function optionalAuth(config: AppConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.header('authorization'));
    if (token) {
      try {
        const payload = verifyToken(token, config.jwtSecret);
        req.userId = payload.id;
      } catch {
        // Anonymous access is permitted; ignore invalid tokens.
      }
    }
    next();
  };
}
