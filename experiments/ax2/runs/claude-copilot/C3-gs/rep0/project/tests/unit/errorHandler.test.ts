import { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from '../../src/errors/AppError';

/**
 * Build a minimal mock Express response that records status and JSON body.
 */
function mockResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

const noopNext = (): void => undefined;
const emptyRequest = {} as Request;

describe('errorHandler', () => {
  it('formats ValidationError with field-prefixed messages and 422', () => {
    const res = mockResponse();
    errorHandler(
      new ValidationError({ email: ["can't be blank", 'is invalid'] }),
      emptyRequest,
      res,
      noopNext
    );
    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({
      errors: { body: ["email can't be blank", 'email is invalid'] }
    });
  });

  it.each([
    [new NotFoundError('article not found'), 404],
    [new UnauthorizedError('token is invalid'), 401],
    [new ForbiddenError('not the author'), 403],
    [new ConflictError('email has already been taken'), 409]
  ])('maps %s to its status code in Conduit format', (error, status) => {
    const res = mockResponse();
    errorHandler(error, emptyRequest, res, noopNext);
    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({ errors: { body: [(error as Error).message] } });
  });

  it('maps an unknown error to 500', () => {
    const res = mockResponse();
    errorHandler(new Error('boom'), emptyRequest, res, noopNext);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ errors: { body: ['boom'] } });
  });

  it('maps a non-Error throw to 500 with a generic message', () => {
    const res = mockResponse();
    errorHandler('weird', emptyRequest, res, noopNext);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ errors: { body: ['Internal server error'] } });
  });
});

describe('notFoundHandler', () => {
  it('responds 404 in Conduit format', () => {
    const res = mockResponse();
    notFoundHandler(emptyRequest, res);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ errors: { body: ['not found'] } });
  });
});
