import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

/** Creates request-body validation middleware for a Zod schema. */
export function validateBody(schema: ZodType) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      response.status(422).json({
        errors: { body: result.error.issues.map((issue) => issue.message) }
      });
      return;
    }
    request.body = result.data;
    next();
  };
}
