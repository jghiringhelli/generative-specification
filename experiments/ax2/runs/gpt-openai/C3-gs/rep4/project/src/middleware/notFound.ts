import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/AppError';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new NotFoundError(`Route '${request.method} ${request.path}' was not found`));
};
