import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../auth/AuthService';
import { UnauthorizedError } from '../errors/AppError';
import { OptionalAuthRequest } from './request';

function tokenFrom(request: Request): string | null {
  const header = request.header('Authorization');
  if (!header) return null;
  const match = /^Token\s+(.+)$/i.exec(header);
  return match?.[1] ?? null;
}

export function authentication(auth: AuthService, required: boolean) {
  return (request: OptionalAuthRequest, _response: Response, next: NextFunction): void => {
    try {
      const token = tokenFrom(request);
      if (!token && required) throw new UnauthorizedError();
      if (token) request.userId = auth.verifyToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
