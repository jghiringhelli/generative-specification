import { Request, Response, NextFunction } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
