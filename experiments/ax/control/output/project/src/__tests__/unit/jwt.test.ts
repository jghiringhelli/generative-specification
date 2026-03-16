import { signToken, verifyToken } from '../../utils/jwt';

describe('JWT Utils', () => {
  const userId = 'test-user-id-123';

  describe('signToken', () => {
    it('returns a JWT string', () => {
      const token = signToken(userId);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('returns the payload for a valid token', () => {
      const token = signToken(userId);
      const payload = verifyToken(token);
      
      expect(payload.userId).toBe(userId);
    });

    it('throws error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('throws error for malformed token', () => {
      const malformedToken = 'not-a-token';
      
      expect(() => verifyToken(malformedToken)).toThrow('Invalid or expired token');
    });
  });
});
