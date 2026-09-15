import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/jwt';

export const extractToken = (req: AuthenticatedRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return null;
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      errors: {
        authorization: ['Token is missing']
      }
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      errors: {
        authorization: ['Token is invalid or expired']
      }
    });
    return;
  }

  req.user = payload;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
};
