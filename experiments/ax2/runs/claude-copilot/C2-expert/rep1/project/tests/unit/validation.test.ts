import { z } from 'zod';
import { formatZodError } from '../../src/lib/validation';

describe('formatZodError', () => {
  it('prefixes each message with its field path', () => {
    const schema = z.object({ email: z.string().email('must be a valid email') });
    const result = schema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = formatZodError(result.error);
      expect(messages).toContain('email must be a valid email');
    }
  });

  it('returns one message per failing field', () => {
    const schema = z.object({
      email: z.string().email('must be a valid email'),
      username: z.string().min(1, 'is required')
    });
    const result = schema.safeParse({ email: 'bad', username: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error)).toHaveLength(2);
    }
  });
});
