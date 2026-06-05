/**
 * Unit specs for the JWT token service. Adversarial: every way a token can be
 * invalid (wrong secret, tampered, expired, malformed payload) must surface as
 * an UnauthorizedError, and a valid token must round-trip.
 */
import { describe, expect, it } from '@jest/globals';
import jwtPkg from 'jsonwebtoken';
import { JwtTokenService } from './JwtTokenService.js';
import { UnauthorizedError } from '../../errors/AppError.js';

const SECRET = 'unit-test-secret-at-least-32-bytes-xx';

describe('JwtTokenService', () => {
  const service = new JwtTokenService(SECRET, '7d');

  it('signs a token that round-trips back to the same userId', () => {
    const token = service.sign({ userId: 'user-1' });
    expect(typeof token).toBe('string');
    expect(service.verify(token)).toEqual({ userId: 'user-1' });
  });

  it('rejects a token signed with a different secret', () => {
    const other = new JwtTokenService('another-secret-at-least-32-bytes-yyy', '7d');
    expect(() => service.verify(other.sign({ userId: 'user-1' }))).toThrow(UnauthorizedError);
  });

  it('rejects a tampered token', () => {
    const token = service.sign({ userId: 'user-1' });
    const tampered = `${token.slice(0, -2)}${token.endsWith('a') ? 'bb' : 'aa'}`;
    expect(() => service.verify(tampered)).toThrow(UnauthorizedError);
  });

  it('rejects a garbage token', () => {
    expect(() => service.verify('not.a.jwt')).toThrow(UnauthorizedError);
  });

  it('rejects an expired token', () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 60;
    const token = jwtPkg.sign({ userId: 'user-1', exp: expiredAt }, SECRET, { algorithm: 'HS256' });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects a token whose payload lacks a string userId', () => {
    const token = jwtPkg.sign({ notUser: 'x' }, SECRET, { algorithm: 'HS256' });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects a token whose payload is a bare string', () => {
    const token = jwtPkg.sign('just-a-string', SECRET, { algorithm: 'HS256' });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects a token whose userId is an empty string', () => {
    const token = jwtPkg.sign({ userId: '' }, SECRET, { algorithm: 'HS256' });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it('honours a number expiry without throwing', () => {
    const numericService = new JwtTokenService(SECRET, 3600);
    expect(numericService.verify(numericService.sign({ userId: 'u' }))).toEqual({ userId: 'u' });
  });
});
