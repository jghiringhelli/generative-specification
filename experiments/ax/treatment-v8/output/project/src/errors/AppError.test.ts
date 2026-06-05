/**
 * Unit specs for the application error hierarchy. These pin the HTTP status and
 * machine code each error maps to — the error handler relies on those values.
 */
import { describe, expect, it } from '@jest/globals';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './AppError.js';

describe('AppError hierarchy', () => {
  it('marks every operational error as operational and names it after its class', () => {
    const error = new ConflictError('email has already been taken');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('ConflictError');
  });

  it('NotFoundError is 404 and includes the identifier when given', () => {
    const error = new NotFoundError('User', 'abc');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('not_found');
    expect(error.message).toBe("User 'abc' not found");
  });

  it('NotFoundError omits the identifier clause when none is given', () => {
    expect(new NotFoundError('User').message).toBe('User not found');
  });

  it('UnauthorizedError is 401 with a default message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('unauthorized');
    expect(error.message).toBe('Authentication required');
  });

  it('ForbiddenError is 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('forbidden');
  });

  it('ConflictError is 409', () => {
    expect(new ConflictError('dup').statusCode).toBe(409);
    expect(new ConflictError('dup').code).toBe('conflict');
  });

  it('ValidationError is 422 and carries per-field messages', () => {
    const error = new ValidationError({ email: ['is invalid'] });
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('validation_error');
    expect(error.fields).toEqual({ email: ['is invalid'] });
  });
});
