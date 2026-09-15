import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/errors/app-error';

describe('Application Error Classes', () => {
  it('instantiates AppError with status code and message array', () => {
    const error = new AppError(418, 'I am a teapot');
    expect(error.statusCode).toBe(418);
    expect(error.messages).toEqual(['I am a teapot']);
    expect(error.message).toBe('I am a teapot');
  });

  it('instantiates ValidationError with 422 status and multiple messages', () => {
    const error = new ValidationError(['field1 is required', 'field2 is too short']);
    expect(error.statusCode).toBe(422);
    expect(error.messages).toEqual(['field1 is required', 'field2 is too short']);
  });

  it('instantiates UnauthorizedError with default 401 status and message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.messages).toEqual(['Unauthorized']);
  });

  it('instantiates ForbiddenError with default 403 status and message', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.messages).toEqual(['Forbidden']);
  });

  it('instantiates NotFoundError with default 404 status and message', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.messages).toEqual(['Resource not found']);
  });
});
