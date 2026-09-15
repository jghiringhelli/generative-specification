import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../../src/utils/security';

describe('Security Utilities', () => {
  describe('hashPassword and verifyPassword', () => {
    it('hashes a plaintext password and verifies it successfully', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);

      const isMatch = await verifyPassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('returns false when verifying an incorrect password against a hash', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);

      const isMatch = await verifyPassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('signToken and verifyToken', () => {
    it('generates a valid JWT token that decodes back to the provided payload', () => {
      const payload = {
        userId: 'test-user-uuid-1234',
        email: 'test@example.com',
      };

      const token = signToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('throws an error when verifying an invalid token string', () => {
      expect(() => {
        verifyToken('invalid.token.string');
      }).toThrow();
    });
  });
});
