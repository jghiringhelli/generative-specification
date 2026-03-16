import { AppError } from './AppError';

/**
 * 401 Unauthorized
 * Missing or invalid credentials.
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;

  constructor(message = 'Authentication required', context?: Record<string, unknown>) {
    super(message, context);
  }
}
