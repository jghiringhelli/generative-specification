import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { ArticleForbiddenError, ArticleNotFoundError } from '../../src/articles/article.errors';
import { errorMiddleware } from '../../src/http/error.middleware';

function responseDouble() {
  const response = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.payload = payload; return this; },
  };
  return response;
}

function handle(error: unknown) {
  const response = responseDouble();
  errorMiddleware(error, {} as Request, response as unknown as Response, () => undefined);
  return response;
}

describe('HTTP error formatting', () => {
  test('formats validation errors as a 422 body error array', () => {
    let error: ZodError;
    try { z.string().email().parse('invalid'); throw new Error('expected validation error'); }
    catch (caught) { error = caught as ZodError; }
    const response = handle(error);
    expect(response.statusCode).toBe(422);
    expect(response.payload).toEqual({ errors: { body: expect.any(Array) } });
  });

  test('formats forbidden errors as a 403 body error array', () => {
    const response = handle(new ArticleForbiddenError('article'));
    expect(response.statusCode).toBe(403);
    expect(response.payload).toEqual({ errors: { body: ['Only the author may modify article article'] } });
  });

  test('formats not-found errors as a 404 body error array', () => {
    const response = handle(new ArticleNotFoundError('missing'));
    expect(response.statusCode).toBe(404);
    expect(response.payload).toEqual({ errors: { body: ['Article missing was not found'] } });
  });

  test('formats unexpected errors as a 500 body error array', () => {
    const response = handle(new Error('failure'));
    expect(response.statusCode).toBe(500);
    expect(response.payload).toEqual({ errors: { body: ['internal server error'] } });
  });
});
