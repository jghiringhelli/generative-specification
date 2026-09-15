import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../errors/AppError';

export function validate(request: Request, _response: Response, next: NextFunction): void {
  const result = validationResult(request);
  if (result.isEmpty()) return next();
  next(new ValidationError('Validation failed', { errors: result.array() }));
}
