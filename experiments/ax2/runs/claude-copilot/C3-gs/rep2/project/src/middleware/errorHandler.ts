import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/**
 * Central error-handling middleware. Maps application errors to the RealWorld
 * error envelope `{ "errors": { "body": ["message"] } }` and status codes.
 * @param err - The thrown error.
 * @param _req - The request (unused).
 * @param res - The response.
 * @param _next - The next function (unused; required for Express signature).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ errors: err.fields });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errors: { body: [err.message] } });
    return;
  }
  res.status(500).json({ errors: { body: ['Internal server error'] } });
}

/**
 * 404 handler for unmatched routes.
 * @param _req - The request (unused).
 * @param res - The response.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ errors: { body: ['Not found'] } });
}
