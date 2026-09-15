import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../src/utils/token';

describe('token signing and verification', () => {
  it('signs a token that encodes the user id and username', () => {
    const token = signToken({ id: 42, username: 'alice' });
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('alice');
  });

  it('rejects a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ id: 1, username: 'eve' }, 'other-secret');
    expect(() => verifyToken(foreignToken)).toThrow();
  });

  it('rejects a malformed token string', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});
