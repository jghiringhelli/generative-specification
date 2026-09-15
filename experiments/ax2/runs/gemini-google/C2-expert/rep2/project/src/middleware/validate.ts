import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { formatErrorResponse } from '../lib/errors';

/**
 * Express middleware to validate request body against a Zod schema.
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => {
          const field = err.path.filter((p) => p !== 'body' && p !== 'user' && p !== 'article' && p !== 'comment').join('.');
          return field ? `${field} ${err.message}` : err.message;
        });
        res.status(422).json(formatErrorResponse(messages));
        return;
      }
      next(error);
    }
  };
}

/**
 * Express middleware to validate request query params against a Zod schema.
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => {
          const field = err.path.join('.');
          return field ? `${field} ${err.message}` : err.message;
        });
        res.status(422).json(formatErrorResponse(messages));
        return;
      }
      next(error);
    }
  };
}
