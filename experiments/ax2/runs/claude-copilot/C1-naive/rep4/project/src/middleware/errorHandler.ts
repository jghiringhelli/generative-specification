import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ errors: err.errors });
    return;
  }

  // Prisma unique constraint violation
  const anyErr = err as { code?: string };
  if (anyErr.code === 'P2002') {
    res.status(422).json({ errors: { body: ['Unique constraint violation'] } });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ errors: { body: ['Internal server error'] } });
}
