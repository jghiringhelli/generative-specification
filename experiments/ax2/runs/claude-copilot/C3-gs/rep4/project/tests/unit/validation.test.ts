import { z } from 'zod';
import {
  parseOrThrow,
  registerSchema,
  createArticleSchema,
} from '../../src/validation/schemas';
import { ValidationError } from '../../src/errors/AppError';

describe('parseOrThrow', () => {
  it('returns the parsed value on success', () => {
    const schema = z.object({ name: z.string() });
    expect(parseOrThrow(schema, { name: 'ok' })).toEqual({ name: 'ok' });
  });

  it('throws a ValidationError with field-keyed messages', () => {
    try {
      parseOrThrow(registerSchema, { user: { username: '', email: 'bad', password: '' } });
      fail('expected ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const err = error as ValidationError;
      expect(err.statusCode).toBe(422);
      expect(Object.keys(err.body).length).toBeGreaterThan(0);
    }
  });

  it('rethrows non-zod errors unchanged', () => {
    const throwing = {
      parse: () => {
        throw new Error('boom');
      },
    } as unknown as z.ZodType<unknown>;
    expect(() => parseOrThrow(throwing, {})).toThrow('boom');
  });

  it('accepts a valid create-article payload', () => {
    const parsed = parseOrThrow(createArticleSchema, {
      article: { title: 't', description: 'd', body: 'b', tagList: ['x'] },
    });
    expect(parsed.article.title).toBe('t');
  });
});
