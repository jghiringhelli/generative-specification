import { AppError } from './AppError';

/**
 * 403 Forbidden
 * Authenticated but not authorized for this action.
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;

  constructor(message = 'Forbidden', context?: Record<string, unknown>) {
    super(message, context);
  }
}
