import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../config/logger';

/**
 * Global error handler middleware.
 * Catches all errors and formats them per RealWorld spec.
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body
    }
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Unknown error - return 500
  res.status(500).json({
    errors: {
      body: ['An unexpected error occurred']
    }
  });
}
