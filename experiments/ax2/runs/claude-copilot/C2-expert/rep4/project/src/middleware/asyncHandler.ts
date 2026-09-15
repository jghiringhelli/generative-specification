import { NextFunction, Request, Response } from "express";

/**
 * Wrap an async route handler so rejected promises are forwarded to the
 * Express error-handling middleware.
 * @param handler The async route handler.
 * @returns An Express-compatible handler.
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}
