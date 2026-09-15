import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('produces a hash that differs from the plaintext password', async () => {
    const hash = await hashPassword('secret-password');
    expect(hash).not.toBe('secret-password');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('accepts the correct password when verifying against its hash', async () => {
    const hash = await hashPassword('secret-password');
    await expect(verifyPassword('secret-password', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password when verifying against a hash', async () => {
    const hash = await hashPassword('secret-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
