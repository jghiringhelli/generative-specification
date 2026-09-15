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
      errors: err.errors
    });
    return;
  }

  // Handle JSON parse errors from body-parser
  if ('type' in err && err.type === 'entity.parse.failed') {
    res.status(422).json({
      errors: {
        body: ['Invalid JSON payload received']
      }
    });
    return;
  }

  // Fallback for unexpected internal errors
  res.status(500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
}
