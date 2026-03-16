import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticationError } from '../errors';

/**
 * Extend Express Request to include authenticated user ID.
 */
export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/**
 * Authentication middleware factory.
 * Verifies JWT token from Authorization header.
 */
export function createAuthMiddleware(authService: AuthService) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AuthenticationError('Authorization header missing');
      }

      // RealWorld spec uses "Token <jwt>" not "Bearer <jwt>"
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Token') {
        throw new AuthenticationError('Invalid authorization header format');
      }

      const token = parts[1];
      const userId = authService.verifyToken(token);

      req.userId = userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware.
 * Does not throw if token missing, but validates if present.
 */
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // No token provided, continue without authentication
        next();
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Token') {
        const token = parts[1];
        const userId = authService.verifyToken(token);
        req.userId = userId;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
