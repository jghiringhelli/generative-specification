import { hashPassword, verifyPassword } from '../../src/utils/password.util';

describe('Password utility', () => {
  describe('hashPassword', () => {
    it('produces a bcrypt hash distinct from plaintext password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('produces different salts for identical passwords across invocations', async () => {
      const password = 'mySecretPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('returns true when password matches the hashed value', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('returns false when password does not match the hashed value', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });
});
