/**
 * Unit specs for the Argon2id password hasher. Verifies the real cryptographic
 * behaviour (no mocking of argon2): hashes are opaque, salted, and verifiable.
 */
import { describe, expect, it } from '@jest/globals';
import { Argon2PasswordHasher } from './Argon2PasswordHasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces an argon2id hash that is not the plaintext', async () => {
    const hash = await hasher.hash('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hasher.hash('s3cret-password');
    expect(await hasher.verify(hash, 's3cret-password')).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hasher.hash('s3cret-password');
    expect(await hasher.verify(hash, 'wrong-password')).toBe(false);
  });

  it('salts: the same password hashes to different values each time', async () => {
    const [a, b] = await Promise.all([hasher.hash('same'), hasher.hash('same')]);
    expect(a).not.toBe(b);
  });

  it('returns false (does not throw) for a malformed hash', async () => {
    expect(await hasher.verify('not-a-real-hash', 'whatever')).toBe(false);
  });
});
