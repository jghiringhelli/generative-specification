import jwt from 'jsonwebtoken';
import { signToken, verifyToken, TOKEN_EXPIRY_SECONDS } from '../../src/utils/token';
import { config } from '../../src/config';

describe('JWT token', () => {
  it('signs a token that embeds the user id and username', () => {
    const token = signToken({ id: 42, username: 'alice' });
    const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('alice');
  });

  it('verifies a signed token and returns its payload', () => {
    const token = signToken({ id: 7, username: 'bob' });
    expect(verifyToken(token)).toEqual({ id: 7, username: 'bob' });
  });

  it('throws when verifying a tampered token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });

  it('expires tokens after thirty days', () => {
    expect(TOKEN_EXPIRY_SECONDS).toBe(60 * 60 * 24 * 30);
  });
});
