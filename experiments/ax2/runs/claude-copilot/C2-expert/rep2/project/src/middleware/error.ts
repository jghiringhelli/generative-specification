import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../utils/errors';

/**
 * Formats any error into the RealWorld error envelope:
 * `{ "errors": { "body": ["message", ...] } }`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof DomainError) {
    res.status(err.status).json({ errors: { body: [...err.messages] } });
    return;
  }
  if (err instanceof ZodError) {
    const messages = err.errors.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path} ${issue.message}` : issue.message;
    });
    res.status(422).json({ errors: { body: messages } });
    return;
  }
  const message = err instanceof Error ? err.message : 'internal server error';
  res.status(500).json({ errors: { body: [message] } });
}

/**
 * Terminal 404 handler for unmatched routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ errors: { body: ['route not found'] } });
}
