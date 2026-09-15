// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: err.errors || { body: [err.message] }
    });
    return;
  }

  // Handle generic uncaught errors
  const message = process.env.NODE_ENV === 'test' ? err.message : 'Internal Server Error';
  res.status(500).json({
    errors: {
      body: [message]
    }
  });
}
