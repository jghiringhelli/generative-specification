import { AppError } from './AppError';

/**
 * 403 Forbidden
 * Authenticated but not authorized for this action.
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  private readonly resource: string;

  constructor(message = 'Forbidden', resourceOrContext?: string | Record<string, unknown>) {
    const resource = typeof resourceOrContext === 'string' ? resourceOrContext : 'article';
    const context = typeof resourceOrContext === 'object' ? resourceOrContext : undefined;
    super(message, context);
    this.resource = resource;
  }

  toJSON(): { errors: Record<string, string[]> } {
    return {
      errors: {
        [this.resource]: ['forbidden']
      }
    };
  }
}
