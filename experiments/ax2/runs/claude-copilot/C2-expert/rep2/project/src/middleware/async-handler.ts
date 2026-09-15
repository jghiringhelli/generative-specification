import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so rejected promises reach the error middleware.
 * @param handler the async Express handler.
 * @returns an Express-compatible handler.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
