import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler to forward rejected promises to `next(err)`.
 *
 * Express 4 does not automatically catch async errors — unhandled rejections in async
 * handlers are silently swallowed. This adapter bridges that gap by catching any
 * rejected promise and delegating to Express's error pipeline.
 *
 * @param fn - Async route handler to wrap
 * @returns Synchronous RequestHandler compatible with Express 4
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
