import { Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { errorHandler } from '../../src/middleware/error-handler';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  HttpError,
} from '../../src/errors/http-error';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseStatus: number;
  let responseJson: unknown;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status(code: number) {
        responseStatus = code;
        return this as Response;
      },
      json(body: unknown) {
        responseJson = body;
        return this as Response;
      },
    };
  });

  it('formats ValidationError into 422 status with errors.body array', () => {
    const error = new ValidationError(['Email is taken', 'Username is taken']);

    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(422);
    expect(responseJson).toEqual({
      errors: {
        body: ['Email is taken', 'Username is taken'],
      },
    });
  });

  it('formats UnauthorizedError into 401 status with errors.body array', () => {
    const error = new UnauthorizedError('Token expired');

    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(401);
    expect(responseJson).toEqual({
      errors: {
        body: ['Token expired'],
      },
    });
  });

  it('formats ForbiddenError into 403 status with errors.body array', () => {
    const error = new ForbiddenError('Not allowed to delete article');

    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(403);
    expect(responseJson).toEqual({
      errors: {
        body: ['Not allowed to delete article'],
      },
    });
  });

  it('formats NotFoundError into 404 status with errors.body array', () => {
    const error = new NotFoundError('Article slug not found');

    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(404);
    expect(responseJson).toEqual({
      errors: {
        body: ['Article slug not found'],
      },
    });
  });

  it('formats Zod validation errors into 422 status with path-prefixed messages', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['user', 'email'],
        message: 'Expected string, received number',
      },
    ];
    const zodError = new ZodError(issues);

    errorHandler(zodError, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(422);
    expect(responseJson).toEqual({
      errors: {
        body: ['user.email: Expected string, received number'],
      },
    });
  });

  it('formats unknown generic errors into 500 status with error message in body', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

    expect(responseStatus).toBe(500);
    expect(responseJson).toEqual({
      errors: {
        body: ['Database connection failed'],
      },
    });
  });
});
