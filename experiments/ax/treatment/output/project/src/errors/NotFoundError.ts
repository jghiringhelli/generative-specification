import { AppError } from './AppError';

/**
 * 404 Not Found
 * Requested resource does not exist.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
  }
}
