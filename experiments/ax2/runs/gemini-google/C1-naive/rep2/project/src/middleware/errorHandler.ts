import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err.status) {
    res.status(err.status).json({
      errors: err.errors || { body: [err.message] },
    });
    return;
  }

  res.status(500).json({
    errors: { body: ['Internal Server Error'] },
  });
}
