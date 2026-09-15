import { hashPassword, PASSWORD_HASH_ROUNDS, verifyPassword } from '../../src/auth/password';

describe('password utilities', () => {
  test('hashes a password using the configured work factor', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(Number(hash.split('$')[2])).toBe(PASSWORD_HASH_ROUNDS);
  });

  test('returns true when a password matches its hash', async () => {
    const hash = await hashPassword('secret');
    await expect(verifyPassword('secret', hash)).resolves.toBe(true);
  });

  test('returns false when a password does not match its hash', async () => {
    const hash = await hashPassword('secret');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
