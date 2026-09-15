import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApplicationError } from "../errors";

export type ErrorResponse = {
  readonly statusCode: number;
  readonly body: { readonly errors: { readonly body: ReadonlyArray<string> } };
};

/** Converts an application failure to the RealWorld API error format. */
export function formatError(error: unknown): ErrorResponse {
  if (error instanceof ZodError) {
    return {
      statusCode: 422,
      body: { errors: { body: error.issues.map((issue) => issue.message) } }
    };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      statusCode: 422,
      body: { errors: { body: ["email or username has already been taken"] } }
    };
  }
  if (error instanceof ApplicationError) {
    return { statusCode: error.statusCode, body: { errors: { body: error.details } } };
  }
  return {
    statusCode: 500,
    body: { errors: { body: ["Internal server error"] } }
  };
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const formatted = formatError(error);
  response.status(formatted.statusCode).json(formatted.body);
};
