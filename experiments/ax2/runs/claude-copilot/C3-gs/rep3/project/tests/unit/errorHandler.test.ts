import { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../src/errors/AppError';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('maps ValidationError to 422 with per-field errors', () => {
    const res = mockResponse();
    errorHandler(
      new ValidationError({ email: ['is invalid'] }),
      {} as Request,
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ errors: { email: ['is invalid'] } });
  });

  it('maps NotFoundError to 404 in spec body shape', () => {
    const res = mockResponse();
    errorHandler(new NotFoundError('gone'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['gone'] } });
  });

  it('maps ForbiddenError to 403', () => {
    const res = mockResponse();
    errorHandler(new ForbiddenError('nope'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('maps unknown errors to 500', () => {
    const res = mockResponse();
    errorHandler(new Error('boom'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      errors: { body: ['Internal server error'] },
    });
  });

  it('notFoundHandler returns 404 spec body', () => {
    const res = mockResponse();
    notFoundHandler({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['Not found'] } });
  });
});
