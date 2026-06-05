/**
 * Adapts an async Express handler so rejected promises reach the error
 * middleware. Express 4 forwards *synchronous* throws to `next(err)` but not
 * rejected promises; this wrapper closes that gap in one place instead of a
 * try/catch in every handler.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** An Express handler that may return a promise. */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Wrap an async handler, routing any rejection to `next`.
 *
 * @param handler - the promise-returning handler.
 * @returns a standard Express {@link RequestHandler}.
 */
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
