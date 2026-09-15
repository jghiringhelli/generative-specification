import {
  formatErrorResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
} from '../../src/utils/error.util';
import { HTTP_STATUS } from '../../src/config/constants';

describe('Error utilities', () => {
  describe('formatErrorResponse', () => {
    it('structures error array inside errors.body object', () => {
      const messages = ['First failure', 'Second failure'];
      const response = formatErrorResponse(messages);

      expect(response).toEqual({
        errors: {
          body: ['First failure', 'Second failure']
        }
      });
    });
  });

  describe('Custom Error Classes', () => {
    it('sets HTTP status 422 for ValidationError with formatted errors', () => {
      const err = new ValidationError(['Email already in use']);
      expect(err.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(err.errors).toEqual(['Email already in use']);
      expect(err.message).toBe('Email already in use');
    });

    it('sets HTTP status 401 for UnauthorizedError', () => {
      const err = new UnauthorizedError('Token is invalid');
      expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(err.errors).toEqual(['Token is invalid']);
    });

    it('sets HTTP status 403 for ForbiddenError', () => {
      const err = new ForbiddenError('Access denied');
      expect(err.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(err.errors).toEqual(['Access denied']);
    });

    it('sets HTTP status 404 for NotFoundError', () => {
      const err = new NotFoundError('Resource not found');
      expect(err.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(err.errors).toEqual(['Resource not found']);
    });
  });
});
