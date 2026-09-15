import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { ITokenService } from '../auth/ITokenService';

const TOKEN_PREFIX = 'Token ';

export function requireAuth(tokens: ITokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const authorization = request.header('authorization');
      if (!authorization?.startsWith(TOKEN_PREFIX)) {
        throw new UnauthorizedError('Authentication token is required');
      }
      request.userId = tokens.verify(authorization.slice(TOKEN_PREFIX.length)).userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function optionalAuth(tokens: ITokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith(TOKEN_PREFIX)) return next();
    try {
      request.userId = tokens.verify(authorization.slice(TOKEN_PREFIX.length)).userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
