import { AppError } from './AppError';

/**
 * 404 Not Found
 * Requested resource does not exist.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  private readonly resource: string;

  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
    this.resource = resource;
  }

  toJSON(): { errors: Record<string, string[]> } {
    return {
      errors: {
        [this.resource.toLowerCase()]: ['not found']
      }
    };
  }
}
