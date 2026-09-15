import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../src/lib/jwt';
import { JwtPayload } from '../../src/types';

describe('JWT Utility', () => {
  const samplePayload: JwtPayload = {
    id: 42,
    email: 'user@example.com',
    username: 'testuser'
  };

  it('signs payload and successfully decodes it upon verification', () => {
    const token = signToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(samplePayload.id);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.username).toBe(samplePayload.username);
  });

  it('throws error when verifying an invalid or malformed token string', () => {
    expect(() => {
      verifyToken('not.a.valid.jwt.token');
    }).toThrow();
  });

  it('throws error when token is verified with an incompatible signature', () => {
    const forgedToken = jwt.sign(samplePayload, 'wrong-secret-key');
    expect(() => {
      verifyToken(forgedToken);
    }).toThrow();
  });
});
