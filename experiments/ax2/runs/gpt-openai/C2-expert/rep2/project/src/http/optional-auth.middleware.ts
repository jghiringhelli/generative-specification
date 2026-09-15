import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/token';
import { AuthenticatedRequest } from './request';

const TOKEN_PREFIX = 'Token ';

/** Creates middleware that resolves authentication when a token is supplied. */
export function createOptionalAuthenticationMiddleware(jwtSecret: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const authorization = request.header('Authorization');
    if (!authorization) {
      next();
      return;
    }
    if (!authorization.startsWith(TOKEN_PREFIX)) {
      response.status(401).json({ errors: { body: ['invalid authentication token'] } });
      return;
    }

    try {
      const claims = verifyToken(authorization.slice(TOKEN_PREFIX.length), jwtSecret);
      (request as AuthenticatedRequest).userId = claims.userId;
      next();
    } catch {
      response.status(401).json({ errors: { body: ['invalid authentication token'] } });
    }
  };
}
