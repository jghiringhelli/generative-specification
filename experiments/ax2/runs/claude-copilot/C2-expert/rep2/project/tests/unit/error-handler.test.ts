import { Response } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler } from '../../src/middleware/error';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/utils/errors';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('formats a domain validation error as a 422 body envelope', () => {
    const res = mockResponse();
    errorHandler(new ValidationError(['email is already registered']), {} as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['email is already registered'] } });
  });

  it('maps a not-found domain error to a 404 body envelope', () => {
    const res = mockResponse();
    errorHandler(new NotFoundError('article does not exist'), {} as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('maps a forbidden domain error to a 403 body envelope', () => {
    const res = mockResponse();
    errorHandler(new ForbiddenError('nope'), {} as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('formats a Zod error as a 422 body envelope', () => {
    const res = mockResponse();
    let zodError: ZodError;
    try {
      z.object({ email: z.string().email() }).parse({ email: 'nope' });
      throw new Error('should have thrown');
    } catch (error) {
      zodError = error as ZodError;
    }
    errorHandler(zodError!, {} as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('falls back to a 500 body envelope for unexpected errors', () => {
    const res = mockResponse();
    errorHandler(new Error('boom'), {} as never, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['boom'] } });
  });
});
