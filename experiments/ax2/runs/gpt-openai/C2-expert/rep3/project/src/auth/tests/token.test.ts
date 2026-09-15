import { signToken, verifyToken } from '../token';

describe('token utilities', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });

  it('signs a token that resolves to the supplied user id', () => {
    expect(verifyToken(signToken(42)).userId).toBe(42);
  });

  it('rejects a token signed with another secret', () => {
    const token = signToken(42);
    process.env.JWT_SECRET = 'different-secret';
    expect(() => verifyToken(token)).toThrow();
    process.env.JWT_SECRET = 'test-secret';
  });
});
