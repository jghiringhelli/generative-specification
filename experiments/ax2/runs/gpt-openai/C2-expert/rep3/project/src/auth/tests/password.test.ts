import { hashPassword, verifyPassword } from '../password';

describe('password utilities', () => {
  it('hashes a password and verifies the matching plaintext value', async () => {
    const hash = await hashPassword('secret');
    expect(hash).not.toBe('secret');
    await expect(verifyPassword('secret', hash)).resolves.toBe(true);
  });

  it('rejects a password that does not match the hash', async () => {
    const hash = await hashPassword('secret');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
