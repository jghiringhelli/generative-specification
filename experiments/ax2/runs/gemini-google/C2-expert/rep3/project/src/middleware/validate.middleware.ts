import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Creates middleware to validate request body with a Zod schema.
 *
 * @param {AnyZodObject} schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Creates middleware to validate request query parameters with a Zod schema.
 *
 * @param {AnyZodObject} schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}
