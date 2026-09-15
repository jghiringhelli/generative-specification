import { NextFunction, Request, Response } from "express";
import { ApplicationError } from "../errors/application-error";

/** Converts application errors to the RealWorld error response shape. */
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (error instanceof ApplicationError) {
    response.status(error.statusCode).json({ errors: { body: error.bodyErrors } });
    return;
  }
  response.status(500).json({ errors: { body: ["Internal server error"] } });
}
