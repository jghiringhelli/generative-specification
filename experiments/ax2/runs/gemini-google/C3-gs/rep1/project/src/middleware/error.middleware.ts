import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: err.errors,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.length > 0 ? issue.path[issue.path.length - 1].toString() : 'body';
      if (!formattedErrors[key]) {
        formattedErrors[key] = [];
      }
      formattedErrors[key].push(issue.message);
    }

    res.status(422).json({
      errors: formattedErrors,
    });
    return;
  }

  // Fallback for unhandled server errors
  res.status(500).json({
    errors: {
      body: ['Internal server error'],
    },
  });
}
