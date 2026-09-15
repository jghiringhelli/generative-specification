import { signToken, verifyToken } from '../../src/auth/token';

const SECRET = 'unit-test-secret';

describe('token utilities', () => {
  test('verifies a signed token and returns its user id', () => {
    const token = signToken(42, SECRET);
    expect(verifyToken(token, SECRET).userId).toBe(42);
  });

  test('rejects a token signed with a different secret', () => {
    const token = signToken(42, SECRET);
    expect(() => verifyToken(token, 'different-secret')).toThrow();
  });
});
