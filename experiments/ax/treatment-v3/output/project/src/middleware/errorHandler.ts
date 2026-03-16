import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Centralized error handler middleware.
 * Maps AppError subclasses to RealWorld API spec error format.
 * Format: {"errors": {"body": ["message"]}}
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: {
        body: [err.message]
      }
    });
    return;
  }

  // Unknown errors - log and return generic 500
  console.error('Unhandled error:', err);
  res.status(500).json({
    errors: {
      body: ['Internal server error']
    }
  });
}
