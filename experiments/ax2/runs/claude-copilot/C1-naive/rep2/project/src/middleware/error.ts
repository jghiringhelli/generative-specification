import { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, message: string | string[]) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.status = status;
    this.errors = Array.isArray(message) ? message : [message];
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ errors: { body: err.errors } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ errors: { body: ['Internal server error'] } });
}
