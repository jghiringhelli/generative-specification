import { hashPassword, verifyPassword, BCRYPT_SALT_ROUNDS } from '../../src/utils/password';

describe('password hashing', () => {
  it('produces a hash that differs from the plaintext password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('uses a configured cost factor of twelve rounds', () => {
    expect(BCRYPT_SALT_ROUNDS).toBe(12);
  });

  it('verifies a password against its own hash', async () => {
    const hash = await hashPassword('password123');
    await expect(verifyPassword('password123', hash)).resolves.toBe(true);
  });

  it('rejects a password that does not match the hash', async () => {
    const hash = await hashPassword('password123');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
