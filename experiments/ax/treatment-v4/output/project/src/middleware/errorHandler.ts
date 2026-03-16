import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Format error response per RealWorld spec: {"errors": {"body": ["message"]}}
 */
function formatErrorResponse(message: string): { errors: { body: string[] } } {
  return {
    errors: {
      body: [message]
    }
  };
}

/**
 * Centralized error handler middleware.
 * Maps AppError subclasses to HTTP responses with spec-compliant format.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    // Known application error
    console.warn({
      err,
      statusCode: err.statusCode,
      context: err.context,
      path: req.path,
      method: req.method
    });

    res.status(err.statusCode).json(formatErrorResponse(err.message));
    return;
  }

  // Unknown error - don't leak internals
  console.error({
    err,
    path: req.path,
    method: req.method
  });

  res.status(500).json(formatErrorResponse('Internal server error'));
}
