import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ZodError) {
    const messages = error.errors.map(err => err.message);
    res.status(422).json({ errors: { body: messages } });
    return;
  }

  const errorMessage = error.message || 'Internal server error';
  
  if (
    errorMessage.includes('already registered') ||
    errorMessage.includes('already taken') ||
    errorMessage.includes('already in use')
  ) {
    res.status(422).json({ errors: { body: [errorMessage] } });
    return;
  }

  if (
    errorMessage.includes('Invalid email or password') ||
    errorMessage.includes('Unauthorized')
  ) {
    res.status(401).json({ errors: { body: [errorMessage] } });
    return;
  }

  if (errorMessage.includes('not found')) {
    res.status(404).json({ errors: { body: [errorMessage] } });
    return;
  }

  res.status(500).json({ errors: { body: ['Internal server error'] } });
}
