import { AppError } from './AppError';

/**
 * 401 Unauthorized
 * Missing or invalid credentials.
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  private readonly resource: string;

  constructor(message = 'Authentication required', resource = 'token') {
    super(message);
    this.resource = resource;
  }

  toJSON(): { errors: Record<string, string[]> } {
    return {
      errors: {
        [this.resource]: [this.message]
      }
    };
  }
}
