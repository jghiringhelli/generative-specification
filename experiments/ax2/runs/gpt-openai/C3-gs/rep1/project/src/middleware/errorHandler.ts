import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ errors: { body: [error.message] } });
    return;
  }
  response.status(500).json({ errors: { body: ['Internal server error'] } });
}
