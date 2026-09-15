import { JwtTokenService } from '../../src/services/adapters/JwtTokenService';
import { UnauthorizedError } from '../../src/errors/AppError';

describe('JwtTokenService', () => {
  it('signs a token that verifies back to the same user id', () => {
    const tokens = new JwtTokenService('secret', '7d');
    const token = tokens.sign('user_1');
    expect(tokens.verify(token)).toBe('user_1');
  });

  it('rejects a malformed token', () => {
    const tokens = new JwtTokenService('secret', '7d');
    expect(() => tokens.verify('garbage')).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', () => {
    const signer = new JwtTokenService('secret-a', '7d');
    const verifier = new JwtTokenService('secret-b', '7d');
    const token = signer.sign('user_1');
    expect(() => verifier.verify(token)).toThrow(UnauthorizedError);
  });

  it('defaults the expiry when given an empty string', () => {
    const tokens = new JwtTokenService('secret', '');
    const token = tokens.sign('user_2');
    expect(tokens.verify(token)).toBe('user_2');
  });
});
