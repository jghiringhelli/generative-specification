import { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  body: string[];

  constructor(status: number, body: string[]) {
    super(body.join(', '));
    this.status = status;
    this.body = body;
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ errors: { body: ['Not Found'] } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ errors: { body: err.body } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ errors: { body: ['Internal Server Error'] } });
}
