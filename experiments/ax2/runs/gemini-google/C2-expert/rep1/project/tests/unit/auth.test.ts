import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/modules/users/auth.utils';

describe('Auth Utilities Unit Tests', () => {
  describe('hashPassword and verifyPassword', () => {
    it('hashes a plain text password and verifies it successfully', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('rejects an incorrect password during verification', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('signToken and verifyToken', () => {
    it('signs a JWT payload and verifies it with the same payload data', () => {
      const payload = {
        id: 'user-uuid-1234',
        email: 'user@example.com',
        username: 'testuser'
      };

      const token = signToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.username).toBe(payload.username);
    });

    it('throws an error when verifying an invalid token string', () => {
      expect(() => {
        verifyToken('invalid.token.string');
      }).toThrow();
    });
  });
});
