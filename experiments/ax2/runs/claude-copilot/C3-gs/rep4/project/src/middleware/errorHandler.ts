import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Centralized error-handling adapter. Maps {@link AppError} instances to their
 * status and the RealWorld error envelope `{ errors: { <field>: [msg] } }`, and
 * treats any other error as a 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errors: err.body });
    return;
  }
  res.status(500).json({ errors: { body: ['internal server error'] } });
}
