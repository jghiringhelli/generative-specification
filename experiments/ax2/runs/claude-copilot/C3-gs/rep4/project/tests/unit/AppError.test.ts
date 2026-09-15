import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/errors/AppError';

describe('AppError hierarchy', () => {
  it('maps each error to its status code', () => {
    expect(new ValidationError().statusCode).toBe(422);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
  });

  it('defaults the body to { body: [message] }', () => {
    const err = new NotFoundError('missing');
    expect(err.body).toEqual({ body: ['missing'] });
  });

  it('preserves a custom field body', () => {
    const err = new ValidationError('bad', { email: ['is invalid'] });
    expect(err.body).toEqual({ email: ['is invalid'] });
  });

  it('all errors are instances of AppError', () => {
    for (const err of [
      new ValidationError(),
      new UnauthorizedError(),
      new ForbiddenError(),
      new NotFoundError(),
      new ConflictError(),
    ]) {
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
