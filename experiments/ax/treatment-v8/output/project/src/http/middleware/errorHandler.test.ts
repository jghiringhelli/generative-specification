/**
 * Unit specs for the error-mapping middleware. Drives the handler directly with
 * a minimal fake response so every branch — validation, generic AppError, and
 * the unexpected-error 500 path — is covered without an HTTP round trip.
 */
import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { ConflictError, ValidationError } from '../../errors/AppError.js';
import { createErrorHandler } from './errorHandler.js';

interface Captured {
  status: number | undefined;
  body: unknown;
}

function fakeResponse(): { res: Response; captured: Captured } {
  const captured: Captured = { status: undefined, body: undefined };
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  } as unknown as Response;
  return { res, captured };
}

const req = {} as Request;
const next = (() => undefined) as NextFunction;

describe('createErrorHandler', () => {
  it('maps a ValidationError to 422 with field errors', () => {
    const { res, captured } = fakeResponse();
    createErrorHandler(() => undefined)(
      new ValidationError({ email: ['is invalid'] }),
      req,
      res,
      next,
    );
    expect(captured.status).toBe(422);
    expect(captured.body).toEqual({ errors: { email: ['is invalid'] } });
  });

  it('maps a generic AppError to its status with a body envelope', () => {
    const { res, captured } = fakeResponse();
    createErrorHandler(() => undefined)(new ConflictError('taken'), req, res, next);
    expect(captured.status).toBe(409);
    expect(captured.body).toEqual({ errors: { body: ['taken'] } });
  });

  it('maps an unexpected error to 500 and logs it without leaking details', () => {
    const { res, captured } = fakeResponse();
    const logger = jest.fn();
    const boom = new Error('database on fire');
    createErrorHandler(logger)(boom, req, res, next);
    expect(captured.status).toBe(500);
    expect(captured.body).toEqual({ errors: { body: ['Internal server error'] } });
    expect(logger).toHaveBeenCalledWith(boom);
  });
});
