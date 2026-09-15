import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/** Standard RealWorld error envelope: `{ errors: { body: [...] } }`. */
function envelope(errors: Record<string, string[]>) {
  return { errors };
}

/**
 * Central error-handling middleware. Maps domain errors to HTTP status codes
 * and the spec error body shape; unknown errors become 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json(envelope(err.errors));
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json(envelope({ [err.field]: [err.message] }));
    return;
  }
  res.status(500).json(envelope({ body: ['Internal server error'] }));
}

/** 404 fallback for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(envelope({ body: ['Not found'] }));
}
