import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errors: err.errors });
    return;
  }

  // Handle generic unexpected errors
  res.status(500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
}
