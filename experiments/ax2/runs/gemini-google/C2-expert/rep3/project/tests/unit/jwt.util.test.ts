import { UnauthorizedError } from '../../src/errors/app-error';
import { signToken, verifyToken } from '../../src/utils/jwt.util';

describe('JWT Utilities', () => {
  const testPayload = {
    id: 1,
    email: 'user@example.com',
    username: 'testuser',
  };

  it('signs and verifies valid token correctly', () => {
    const token = signToken(testPayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(testPayload.id);
    expect(decoded.email).toBe(testPayload.email);
    expect(decoded.username).toBe(testPayload.username);
  });

  it('throws UnauthorizedError when token is invalid or corrupted', () => {
    expect(() => {
      verifyToken('invalid.jwt.token');
    }).toThrow(UnauthorizedError);
  });
});
