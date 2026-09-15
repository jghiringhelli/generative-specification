import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err);

  if (err.status) {
    res.status(err.status).json({
      errors: err.errors || { message: [err.message || 'An error occurred'] }
    });
    return;
  }

  res.status(500).json({
    errors: {
      message: ['Internal server error']
    }
  });
};
