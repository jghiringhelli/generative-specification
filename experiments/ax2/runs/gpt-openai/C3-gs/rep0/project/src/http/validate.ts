import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { ValidationError } from '../errors/AppError';

export function validateBody(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(new ValidationError(result.error.issues.map((issue) => issue.message)));
      return;
    }
    request.body = result.data;
    next();
  };
}
