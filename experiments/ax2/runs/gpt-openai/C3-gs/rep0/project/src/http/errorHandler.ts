import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ errors: { body: error.details } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(422).json({
      errors: { body: error.issues.map((issue) => issue.message) },
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = error.code === 'P2025' ? 404 : error.code === 'P2002' ? 422 : 500;
    const message = error.code === 'P2025'
      ? 'Resource was not found'
      : error.code === 'P2002' ? 'A unique value is already in use' : 'Database operation failed';
    response.status(statusCode).json({ errors: { body: [message] } });
    return;
  }
  response.status(500).json({ errors: { body: ['Internal server error'] } });
}
