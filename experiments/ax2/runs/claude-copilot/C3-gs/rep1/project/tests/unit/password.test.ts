import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('produces a hash distinct from the plaintext', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash.startsWith('$argon2')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('password123');
    await expect(verifyPassword(hash, 'password123')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('password123');
    await expect(verifyPassword(hash, 'wrongpassword')).resolves.toBe(false);
  });
});
