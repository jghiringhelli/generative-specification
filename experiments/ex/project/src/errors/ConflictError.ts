import { AppError } from './AppError';

/**
 * 409 Conflict
 * Resource already exists or state conflict.
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  private readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    const message = Object.values(fieldErrors).flat()[0] ?? 'Conflict';
    super(message);
    this.fieldErrors = fieldErrors;
  }

  toJSON(): { errors: Record<string, string[]> } {
    return { errors: this.fieldErrors };
  }
}
