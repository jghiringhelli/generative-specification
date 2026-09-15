import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../src/utils/token';

const SECRET = 'unit-test-secret';

describe('json web token utilities', () => {
  it('signs a token that decodes back to the original payload', () => {
    const token = signToken({ id: 42, username: 'alice' }, SECRET);
    const decoded = verifyToken(token, SECRET);
    expect(decoded).toEqual({ id: 42, username: 'alice' });
  });

  it('throws when verifying a token signed with a different secret', () => {
    const token = signToken({ id: 1, username: 'bob' }, SECRET);
    expect(() => verifyToken(token, 'other-secret')).toThrow();
  });

  it('sets an expiry 30 days in the future on signed tokens', () => {
    const token = signToken({ id: 7, username: 'carol' }, SECRET);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    expect(decoded.exp).toBeDefined();
    expect((decoded.exp as number) - (decoded.iat as number)).toBe(
      thirtyDaysInSeconds
    );
  });
});
