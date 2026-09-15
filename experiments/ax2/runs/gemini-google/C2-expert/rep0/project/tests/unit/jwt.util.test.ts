import { signToken, verifyToken, TokenPayload } from '../../src/utils/jwt.util';
import { UnauthorizedError } from '../../src/utils/error.util';

describe('JWT utility', () => {
  const testPayload: TokenPayload = {
    id: 42,
    username: 'tester',
    email: 'tester@example.com'
  };

  describe('signToken', () => {
    it('generates a valid non-empty JWT string with three segments', () => {
      const token = signToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('decodes encoded claims correctly from a signed token', () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.username).toBe(testPayload.username);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('throws UnauthorizedError when verifying an invalid token string', () => {
      expect(() => verifyToken('invalid.token.structure')).toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError with descriptive message when token is malformed', () => {
      expect(() => verifyToken('random-garbage')).toThrow('Invalid or expired authentication token');
    });
  });
});
