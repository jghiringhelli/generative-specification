import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { ITokenService } from '../auth/ITokenService';

export type AuthMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

/** Creates middleware that requires and verifies a Conduit token header. */
export function createAuthMiddleware(tokens: ITokenService): AuthMiddleware {
  return (request, _response, next): void => {
    const header = request.header('Authorization');
    if (!header?.startsWith('Token ')) {
      next(new UnauthorizedError('Authorization token is required'));
      return;
    }
    request.auth = { userId: tokens.verify(header.slice('Token '.length)) };
    next();
  };
}

/** Creates middleware that reads a token when present without requiring one. */
export function createOptionalAuthMiddleware(
  tokens: ITokenService,
): AuthMiddleware {
  return (request, _response, next): void => {
    const header = request.header('Authorization');
    if (!header) {
      next();
      return;
    }
    if (!header.startsWith('Token ')) {
      next(new UnauthorizedError('Invalid authorization header'));
      return;
    }
    request.auth = { userId: tokens.verify(header.slice('Token '.length)) };
    next();
  };
}
