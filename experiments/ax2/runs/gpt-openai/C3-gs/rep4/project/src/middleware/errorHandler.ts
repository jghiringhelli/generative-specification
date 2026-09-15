import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    const messages = error.details
      ? Object.values(error.details).flat()
      : [error.message];
    response.status(error.statusCode).json({ errors: { body: messages } });
    return;
  }
  if (error instanceof SyntaxError) {
    response.status(422).json({ errors: { body: ['Request body contains invalid JSON'] } });
    return;
  }
  response.status(500).json({ errors: { body: ['Internal server error'] } });
};
