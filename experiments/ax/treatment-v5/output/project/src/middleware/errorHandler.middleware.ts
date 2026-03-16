
/**
 * Centralized error handler middleware.
 * Converts AppError instances to RealWorld API format.
 * Catches unknown errors and returns 500.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (error instanceof AppError) {
    logger.error(
      {
        statusCode: error.statusCode,
        message: error.message,
        context: error.context,
        path: req.path,
        method: req.method
      },
      'Application error'
    );
  } else {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      },
      'Unexpected error'
    );
  }

  // Handle known application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    errors: {
      body: ['internal server error']
    }
  });
}
