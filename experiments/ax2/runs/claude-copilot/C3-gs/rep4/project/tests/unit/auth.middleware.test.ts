import { Request, Response } from 'express';
import { optionalAuth, requireAuth } from '../../src/middleware/auth';
import { JwtTokenService } from '../../src/services/adapters/JwtTokenService';
import { UnauthorizedError } from '../../src/errors/AppError';

const tokens = new JwtTokenService('secret', '7d');

function req(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as Request;
}

describe('requireAuth', () => {
  it('populates userId for a valid Token header', () => {
    const token = tokens.sign('user_1');
    const request = req(`Token ${token}`);
    const next = jest.fn();
    requireAuth(tokens)(request, {} as Response, next);
    expect(request.userId).toBe('user_1');
    expect(next).toHaveBeenCalled();
  });

  it('accepts a Bearer scheme too', () => {
    const token = tokens.sign('user_2');
    const request = req(`Bearer ${token}`);
    requireAuth(tokens)(request, {} as Response, jest.fn());
    expect(request.userId).toBe('user_2');
  });

  it('throws when no header is present', () => {
    expect(() => requireAuth(tokens)(req(), {} as Response, jest.fn())).toThrow(
      UnauthorizedError,
    );
  });

  it('throws when the scheme is unsupported', () => {
    expect(() =>
      requireAuth(tokens)(req('Basic abc'), {} as Response, jest.fn()),
    ).toThrow(UnauthorizedError);
  });
});

describe('optionalAuth', () => {
  it('proceeds anonymously without a header', () => {
    const request = req();
    const next = jest.fn();
    optionalAuth(tokens)(request, {} as Response, next);
    expect(request.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('populates userId when a valid token is present', () => {
    const token = tokens.sign('user_3');
    const request = req(`Token ${token}`);
    optionalAuth(tokens)(request, {} as Response, jest.fn());
    expect(request.userId).toBe('user_3');
  });
});
