import {
  formatErrorResponse,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError
} from '../../src/lib/errors';

describe('Error Handling and Formatting Utility', () => {
  it('formats single error string into expected Conduit response structure', () => {
    const formatted = formatErrorResponse('Something went wrong');
    expect(formatted).toEqual({
      errors: {
        body: ['Something went wrong']
      }
    });
  });

  it('formats array of multiple error strings preserving all error items', () => {
    const messages = ['email is taken', 'password is too short'];
    const formatted = formatErrorResponse(messages);
    expect(formatted).toEqual({
      errors: {
        body: messages
      }
    });
  });

  it('creates AppError with correct status code and message list', () => {
    const err = new AppError(418, ['I am a teapot']);
    expect(err.statusCode).toBe(418);
    expect(err.errors).toEqual(['I am a teapot']);
  });

  it('creates ValidationError with HTTP 422 status code', () => {
    const err = new ValidationError('Invalid input provided');
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual(['Invalid input provided']);
  });

  it('creates UnauthorizedError with HTTP 401 status code and default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.errors).toEqual(['Unauthorized']);
  });

  it('creates ForbiddenError with HTTP 403 status code', () => {
    const err = new ForbiddenError('Action not allowed');
    expect(err.statusCode).toBe(403);
    expect(err.errors).toEqual(['Action not allowed']);
  });

  it('creates NotFoundError with HTTP 404 status code', () => {
    const err = new NotFoundError('Resource missing');
    expect(err.statusCode).toBe(404);
    expect(err.errors).toEqual(['Resource missing']);
  });
});
