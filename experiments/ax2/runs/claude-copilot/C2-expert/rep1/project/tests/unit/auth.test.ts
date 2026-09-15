import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/lib/auth';

const SECRET = 'unit-test-secret';

describe('password hashing', () => {
  it('produces a hash that differs from the plaintext password', async () => {
    const hash = await hashPassword('s3cret-password');
    expect(hash).not.toBe('s3cret-password');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('the-real-password');
    await expect(verifyPassword('a-wrong-password', hash)).resolves.toBe(false);
  });
});

describe('json web tokens', () => {
  it('round-trips the identity claims when signing then verifying', () => {
    const token = signToken({ id: 42, username: 'alice' }, SECRET);
    const payload = verifyToken(token, SECRET);
    expect(payload.id).toBe(42);
    expect(payload.username).toBe('alice');
  });

  it('throws when verifying a token signed with a different secret', () => {
    const token = signToken({ id: 1, username: 'bob' }, SECRET);
    expect(() => verifyToken(token, 'a-different-secret')).toThrow();
  });

  it('throws when verifying a malformed token', () => {
    expect(() => verifyToken('not-a-real-token', SECRET)).toThrow();
  });
});
