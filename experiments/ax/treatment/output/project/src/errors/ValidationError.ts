import { AppError } from './AppError';

/**
 * 422 Unprocessable Entity
 * Used for input validation failures.
 */
export class ValidationError extends AppError {
  readonly statusCode = 422;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
