import { formatError } from './formatError';

describe('formatError', () => {
  it('returns a resource-scoped error envelope', () => {
    const result = formatError('article', ['not found']);
    expect(result).toEqual({ errors: { article: ['not found'] } });
  });

  it('supports multiple messages for the same resource', () => {
    const result = formatError('user', ['is invalid', 'is required']);
    expect(result).toEqual({ errors: { user: ['is invalid', 'is required'] } });
  });

  it('uses the provided resource name as the key', () => {
    const result = formatError('profile', ['not found']);
    expect(Object.keys(result.errors)).toEqual(['profile']);
  });

  it('returns errors as an array even for a single message', () => {
    const result = formatError('comment', ['is missing']);
    expect(Array.isArray(result.errors.comment)).toBe(true);
  });
});
