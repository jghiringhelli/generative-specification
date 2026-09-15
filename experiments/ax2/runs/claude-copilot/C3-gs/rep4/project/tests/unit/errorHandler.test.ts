import { Request, Response } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler';
import { NotFoundError } from '../../src/errors/AppError';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('maps an AppError to its status and error envelope', () => {
    const res = mockResponse();
    errorHandler(new NotFoundError('missing'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['missing'] } });
  });

  it('maps an unknown error to a 500 envelope', () => {
    const res = mockResponse();
    errorHandler(new Error('kaboom'), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['internal server error'] } });
  });
});
