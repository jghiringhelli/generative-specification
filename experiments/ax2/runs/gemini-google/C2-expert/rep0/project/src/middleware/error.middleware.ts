import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '../utils/error.util';
import { HTTP_STATUS } from '../config/constants';

/**
 * Global Express error handling middleware.
 * Formats all unhandled errors into the standardized RealWorld error format.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatErrorResponse(err.errors));
    return;
  }

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(formatErrorResponse(['Malformed JSON payload']));
    return;
  }

  // Fallback for unexpected errors
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    formatErrorResponse([err.message || 'Internal server error'])
  );
}
