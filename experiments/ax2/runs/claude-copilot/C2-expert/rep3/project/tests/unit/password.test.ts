import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('password hashing', () => {
  it('produces a hash that differs from the plaintext password', async () => {
    const hash = await hashPassword('s3cret-password');
    expect(hash).not.toBe('s3cret-password');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(
      verifyPassword('correct horse battery staple', hash),
    ).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('the-right-one');
    await expect(verifyPassword('the-wrong-one', hash)).resolves.toBe(false);
  });
});
