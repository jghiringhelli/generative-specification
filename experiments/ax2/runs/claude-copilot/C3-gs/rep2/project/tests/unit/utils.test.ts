import { signToken, verifyToken } from '../../src/utils/token';
import { hashPassword, verifyPassword } from '../../src/utils/password';
import { slugFromTitle } from '../../src/utils/slug';

describe('token utils', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken(42, 'secret', '1h');
    expect(verifyToken(token, 'secret').userId).toBe(42);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signToken(1, 'secret-a', '1h');
    expect(() => verifyToken(token, 'secret-b')).toThrow();
  });
});

describe('password utils', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).not.toBe('correct horse');
    expect(await verifyPassword(hash, 'correct horse')).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('right');
    expect(await verifyPassword(hash, 'wrong')).toBe(false);
  });
});

describe('slug util', () => {
  it('produces a lowercase, hyphenated slug from a title', () => {
    expect(slugFromTitle('Hello World')).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it('produces a non-empty slug for a symbol-only title', () => {
    expect(slugFromTitle('***').length).toBeGreaterThan(0);
  });
});
