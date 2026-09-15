import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '../lib/errors';

/**
 * Global Express error handling middleware.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatErrorResponse(err.errors));
    return;
  }

  // Handle Prisma unique constraint error P2002 if it bubbles up
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
    const meta = (err as { meta?: { target?: string[] } }).meta;
    const target = meta?.target ? meta.target.join(', ') : 'field';
    res.status(422).json(formatErrorResponse(`${target} is already taken`));
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json(formatErrorResponse(message));
}
