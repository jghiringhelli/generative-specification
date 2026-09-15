import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { TokenService } from '../auth/ports';

function readToken(header: string | undefined): string {
  if (!header) {
    throw new UnauthorizedError('Authorization token is required');
  }
  const [scheme, token] = header.split(' ');
  if (!token || !['Token', 'Bearer'].includes(scheme)) {
    throw new UnauthorizedError('Authorization header is invalid');
  }
  return token;
}

/** Creates middleware that requires a valid authentication token. */
export function requireAuth(tokens: TokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      request.userId = tokens.verify(readToken(request.header('authorization')));
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Creates middleware that accepts, but does not require, authentication. */
export function optionalAuth(tokens: TokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const header = request.header('authorization');
    if (!header) {
      next();
      return;
    }
    try {
      request.userId = tokens.verify(readToken(header));
      next();
    } catch (error) {
      next(error);
    }
  };
}
