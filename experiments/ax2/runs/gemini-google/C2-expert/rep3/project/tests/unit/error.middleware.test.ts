import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { NotFoundError, ValidationError } from '../../src/errors/app-error';
import { errorHandler } from '../../src/middleware/error.middleware';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  const nextMock = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('formats AppError into conduit error response with correct status code', () => {
    const error = new NotFoundError('Article slug not found');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: {
        body: ['Article slug not found'],
      },
    });
  });

  it('formats ZodError into conduit 422 error response', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    let zodErr: ZodError | null = null;
    try {
      schema.parse({ email: 'not-an-email' });
    } catch (e) {
      zodErr = e as ZodError;
    }

    errorHandler(zodErr!, mockRequest as Request, mockResponse as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: {
        body: expect.arrayContaining([expect.stringContaining('email')]),
      },
    });
  });

  it('formats unknown runtime error into 500 status code with fallback message', () => {
    const error = new Error('Database connection failed');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: {
        body: ['Database connection failed'],
      },
    });
  });
});
