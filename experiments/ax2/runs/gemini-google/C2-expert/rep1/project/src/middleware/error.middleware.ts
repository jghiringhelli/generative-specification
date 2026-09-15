import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export function formatErrorMessages(error: unknown): { status: number; body: string[] } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: error.messages
    };
  }

  if (error instanceof ZodError) {
    const messages = error.errors.map((err) => {
      const fieldPath = err.path.join('.');
      return fieldPath ? `${fieldPath} ${err.message}` : err.message;
    });
    return {
      status: 422,
      body: messages.length > 0 ? messages : ['Validation failed']
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: [error.message || 'Internal server error']
    };
  }

  return {
    status: 500,
    body: ['Internal server error']
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const { status, body } = formatErrorMessages(err);
  res.status(status).json({
    errors: {
      body
    }
  });
}
