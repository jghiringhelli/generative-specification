// tests/unit/AppError.test.ts
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError
} from '../../src/errors/AppError';

describe('AppError Hierarchy', () => {
  it('instantiates NotFoundError with 404 status and formatted body', () => {
    const error = new NotFoundError('Article not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Article not found');
    expect(error.errors).toEqual({ body: ['Article not found'] });
  });

  it('instantiates UnauthorizedError with 401 status and formatted body', () => {
    const error = new UnauthorizedError('Invalid token');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid token');
    expect(error.errors).toEqual({ body: ['Invalid token'] });
  });

  it('instantiates ForbiddenError with 403 status and formatted body', () => {
    const error = new ForbiddenError('Author only');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Author only');
    expect(error.errors).toEqual({ body: ['Author only'] });
  });

  it('instantiates ValidationError with 422 status and field errors', () => {
    const error = new ValidationError('Validation failed', {
      email: ["can't be blank"],
      password: ["can't be blank"]
    });
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual({
      email: ["can't be blank"],
      password: ["can't be blank"]
    });
  });

  it('instantiates ConflictError with 409 status', () => {
    const error = new ConflictError('User already exists');
    expect(error.statusCode).toBe(409);
    expect(error.errors).toEqual({ body: ['User already exists'] });
  });
});
