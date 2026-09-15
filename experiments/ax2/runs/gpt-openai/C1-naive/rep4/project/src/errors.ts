import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    response.status(422).json({
      errors: { body: error.issues.map((issue) => issue.message) },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    response.status(422).json({ errors: { body: ["email or username already exists"] } });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({ errors: { body: [error.message] } });
    return;
  }

  response.status(500).json({ errors: { body: ["internal server error"] } });
}
