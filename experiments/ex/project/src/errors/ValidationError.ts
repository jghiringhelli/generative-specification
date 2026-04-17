import { AppError } from './AppError';

/**
 * 422 Unprocessable Entity
 * Used for input validation failures.
 */
export class ValidationError extends AppError {
  readonly statusCode = 422;
  private readonly fieldErrors: Record<string, string[]>;

  constructor(messageOrFields: string | Record<string, string[]>, context?: Record<string, unknown>) {
    const message = typeof messageOrFields === 'string'
      ? messageOrFields
      : Object.values(messageOrFields).flat()[0] ?? 'Validation failed';
    super(message, context);
    this.fieldErrors = typeof messageOrFields === 'string'
      ? { body: [messageOrFields] }
      : messageOrFields;
  }

  toJSON(): { errors: Record<string, string[]> } {
    return { errors: this.fieldErrors };
  }
}
