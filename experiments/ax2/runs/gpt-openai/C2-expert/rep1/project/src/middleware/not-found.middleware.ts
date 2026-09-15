import { Request, Response } from "express";

/** Returns a spec-shaped response for unmatched API routes. */
export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({ errors: { body: ["Route does not exist"] } });
}
