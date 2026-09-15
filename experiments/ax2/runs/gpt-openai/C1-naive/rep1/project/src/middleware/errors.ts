import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { ApiError } from "../errors";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    response.status(error.status).json({ errors: error.errors });
    return;
  }
  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => issue.message);
    response.status(422).json({ errors: { body: messages } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = error.code === "P2025" ? 404 : 422;
    response.status(status).json({ errors: { body: ["database request failed"] } });
    return;
  }
  response.status(500).json({ errors: { body: ["internal server error"] } });
}
