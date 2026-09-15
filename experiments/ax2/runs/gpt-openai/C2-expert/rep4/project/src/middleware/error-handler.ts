import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../errors";

export interface ErrorResponse {
  readonly errors: Readonly<Record<string, readonly string[]>>;
}

function messages(error: ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/** Converts an application or validation error to the API error contract. */
export function formatError(error: AppError | ZodError): ErrorResponse {
  if (error instanceof ZodError) {
    return { errors: { body: messages(error) } };
  }
  return { errors: { [error.field]: [error.message] } };
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json(formatError(error));
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const conflict = new ValidationError("Email or username is already registered");
    response.status(conflict.statusCode).json({ errors: { body: [conflict.message] } });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json(formatError(error));
    return;
  }
  response.status(500).json({ errors: { body: ["Internal server error"] } });
};
