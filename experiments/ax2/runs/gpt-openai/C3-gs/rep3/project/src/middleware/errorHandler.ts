import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      errors: { body: error.issues.map((issue) => issue.message) },
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ errors: { body: [error.message] } });
    return;
  }
  response.status(500).json({ errors: { body: ['Internal server error'] } });
};
