import { hashPassword, verifyPassword } from '../../src/lib/password';

describe('Password Utility', () => {
  it('hashes plain text password and verifies matching password successfully', async () => {
    const plain = 'superSecretPassword123!';
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);

    const isMatch = await verifyPassword(plain, hash);
    expect(isMatch).toBe(true);
  });

  it('returns false when verifying incorrect password against hash', async () => {
    const plain = 'superSecretPassword123!';
    const hash = await hashPassword(plain);

    const isMatch = await verifyPassword('wrongPassword', hash);
    expect(isMatch).toBe(false);
  });

  it('generates distinct hashes for identical passwords due to salt', async () => {
    const plain = 'samePassword';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);

    expect(hash1).not.toEqual(hash2);
    expect(await verifyPassword(plain, hash1)).toBe(true);
    expect(await verifyPassword(plain, hash2)).toBe(true);
  });
});
