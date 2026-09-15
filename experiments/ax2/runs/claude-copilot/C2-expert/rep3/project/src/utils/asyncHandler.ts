import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error-handling middleware instead of crashing the process.
 * @param handler the async route handler to wrap
 * @returns an Express-compatible handler
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
