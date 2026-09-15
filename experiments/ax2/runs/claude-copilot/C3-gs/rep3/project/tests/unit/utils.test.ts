import { generateToken, verifyToken } from '../../src/utils/token';
import { generateSlug } from '../../src/utils/slug';

describe('token utilities', () => {
  const secret = 'utility-secret';

  it('round-trips a payload through sign and verify', () => {
    const token = generateToken({ id: 42, username: 'zed' }, secret, '1h');
    const decoded = verifyToken(token, secret);
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('zed');
  });

  it('throws when verifying with the wrong secret', () => {
    const token = generateToken({ id: 1, username: 'a' }, secret, '1h');
    expect(() => verifyToken(token, 'other-secret')).toThrow();
  });
});

describe('slug utility', () => {
  it('produces a lowercase, hyphenated slug', () => {
    const slug = generateSlug('My Great Title');
    expect(slug).toMatch(/^my-great-title-[a-z0-9]+$/);
  });

  it('produces distinct slugs for identical titles', () => {
    const a = generateSlug('Same Title');
    const b = generateSlug('Same Title');
    expect(a).not.toBe(b);
  });
});
