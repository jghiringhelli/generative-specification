import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

/** Creates query-string validation middleware for a Zod schema. */
export function validateQuery(schema: ZodType) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      response.status(422).json({
        errors: { body: result.error.issues.map((issue) => issue.message) }
      });
      return;
    }
    response.locals.validatedQuery = result.data;
    next();
  };
}
