import { z } from 'zod';
import { formatErrorMessages } from '../../src/middleware/error.middleware';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from '../../src/errors/app-error';

describe('Error Formatter Unit Tests', () => {
  it('formats ValidationError into status 422 with body messages', () => {
    const error = new ValidationError(['email is invalid', 'password is too short']);
    const result = formatErrorMessages(error);

    expect(result.status).toBe(422);
    expect(result.body).toEqual(['email is invalid', 'password is too short']);
  });

  it('formats UnauthorizedError into status 401 with body message', () => {
    const error = new UnauthorizedError('Authentication token is required');
    const result = formatErrorMessages(error);

    expect(result.status).toBe(401);
    expect(result.body).toEqual(['Authentication token is required']);
  });

  it('formats ForbiddenError into status 403 with body message', () => {
    const error = new ForbiddenError('Action not allowed');
    const result = formatErrorMessages(error);

    expect(result.status).toBe(403);
    expect(result.body).toEqual(['Action not allowed']);
  });

  it('formats NotFoundError into status 404 with body message', () => {
    const error = new NotFoundError('Article not found');
    const result = formatErrorMessages(error);

    expect(result.status).toBe(404);
    expect(result.body).toEqual(['Article not found']);
  });

  it('formats ConflictError into status 422 with body message', () => {
    const error = new ConflictError('username has already been taken');
    const result = formatErrorMessages(error);

    expect(result.status).toBe(422);
    expect(result.body).toEqual(['username has already been taken']);
  });

  it('formats ZodError into status 422 with formatted path messages', () => {
    const testSchema = z.object({
      user: z.object({
        email: z.string().email(),
        age: z.number().min(18)
      })
    });

    let zodError: any;
    try {
      testSchema.parse({ user: { email: 'invalid-email', age: 10 } });
    } catch (err) {
      zodError = err;
    }

    const result = formatErrorMessages(zodError);

    expect(result.status).toBe(422);
    expect(result.body.length).toBeGreaterThan(0);
    expect(result.body.some((msg) => msg.includes('user.email'))).toBe(true);
  });

  it('formats unknown generic Error into status 500', () => {
    const genericError = new Error('Database connection failed');
    const result = formatErrorMessages(genericError);

    expect(result.status).toBe(500);
    expect(result.body).toEqual(['Database connection failed']);
  });
});
