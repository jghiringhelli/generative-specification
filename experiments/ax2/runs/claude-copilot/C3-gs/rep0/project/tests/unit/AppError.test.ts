import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from '../../src/errors/AppError';

describe('AppError hierarchy', () => {
  it('AppError carries message and status code', () => {
    const error = new AppError('custom', 418);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('custom');
    expect(error.statusCode).toBe(418);
    expect(error.name).toBe('AppError');
  });

  it.each([
    [new NotFoundError(), 404, 'NotFoundError'],
    [new UnauthorizedError(), 401, 'UnauthorizedError'],
    [new ForbiddenError(), 403, 'ForbiddenError'],
    [new ConflictError(), 409, 'ConflictError']
  ])('%s has the right status and name', (error, status, name) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(status);
    expect(error.name).toBe(name);
  });

  it('ValidationError is 422 and exposes fields', () => {
    const error = new ValidationError({ title: ["can't be blank"] });
    expect(error.statusCode).toBe(422);
    expect(error.fields).toEqual({ title: ["can't be blank"] });
    expect(error).toBeInstanceOf(AppError);
  });
});
