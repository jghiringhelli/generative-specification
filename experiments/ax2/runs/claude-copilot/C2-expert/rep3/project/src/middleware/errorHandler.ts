import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors';

/**
 * Central Express error handler. Maps domain and validation errors to the
 * RealWorld error envelope `{ errors: { body: [...] } }`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const messages = err.errors.map(
      (issue) => `${issue.path.join('.')} ${issue.message}`.trim(),
    );
    res.status(422).json({ errors: { body: messages } });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ errors: { body: err.messages } });
    return;
  }

  res.status(500).json({ errors: { body: ['internal server error'] } });
}
