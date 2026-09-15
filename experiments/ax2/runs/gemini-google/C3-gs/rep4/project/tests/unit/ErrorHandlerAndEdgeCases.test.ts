import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError
} from '../../src/errors/AppError';
import { errorHandler } from '../../src/middleware/errorHandler';
import { authOptional, authRequired, RequestWithUser } from '../../src/middleware/auth';

describe('AppError hierarchy and ErrorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  it('formats NotFoundError with 404 and error body', () => {
    const error = new NotFoundError('Entity missing');
    expect(error.statusCode).toBe(404);
    expect(error.errors).toEqual({ body: ['Entity missing'] });

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ errors: { body: ['Entity missing'] } });
  });

  it('formats UnauthorizedError with 401', () => {
    const error = new UnauthorizedError('Custom unauthorized message');
    expect(error.statusCode).toBe(401);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ errors: { body: ['Custom unauthorized message'] } });
  });

  it('formats ForbiddenError with 403', () => {
    const error = new ForbiddenError('Action not allowed');
    expect(error.statusCode).toBe(403);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ errors: { body: ['Action not allowed'] } });
  });

  it('formats ValidationError with 422 and field errors', () => {
    const error = new ValidationError({ email: ["can't be blank"], username: ['is taken'] });
    expect(error.statusCode).toBe(422);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: { email: ["can't be blank"], username: ['is taken'] }
    });
  });

  it('formats ValidationError with single string message', () => {
    const error = new ValidationError('Simple validation failure');
    expect(error.statusCode).toBe(422);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: { body: ['Simple validation failure'] }
    });
  });

  it('formats ConflictError with 422', () => {
    const error = new ConflictError({ email: ['already exists'] });
    expect(error.statusCode).toBe(422);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: { email: ['already exists'] }
    });
  });

  it('formats ConflictError with string message', () => {
    const error = new ConflictError('Duplicate key');
    expect(error.statusCode).toBe(422);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: { body: ['Duplicate key'] }
    });
  });

  it('handles unknown generic errors as 500', () => {
    const error = new Error('Database connection broke');
    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      errors: { body: ['Database connection broke'] }
    });
  });

  it('authOptional passes without user when no authorization header is provided', () => {
    const req: RequestWithUser = { headers: {} } as any;
    authOptional(req, mockRes as Response, mockNext);
    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('authRequired calls next with UnauthorizedError when header is missing', () => {
    const req: RequestWithUser = { headers: {} } as any;
    authRequired(req, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('authRequired calls next with UnauthorizedError when token is malformed', () => {
    const req: RequestWithUser = {
      headers: { authorization: 'Token invalid.token.payload' }
    } as any;
    authRequired(req, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
