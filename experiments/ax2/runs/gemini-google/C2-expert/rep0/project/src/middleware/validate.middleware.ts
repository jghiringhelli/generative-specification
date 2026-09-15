import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/error.util';

/**
 * Creates an Express middleware for validating request bodies using Zod schemas.
 *
 * @param {AnyZodObject} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        });
        next(new ValidationError(messages));
        return;
      }
      next(error);
    }
  };
}

/**
 * Creates an Express middleware for validating query parameters using Zod schemas.
 *
 * @param {AnyZodObject} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        });
        next(new ValidationError(messages));
        return;
      }
      next(error);
    }
  };
}
