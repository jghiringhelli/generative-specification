/**
 * Authentication middleware: resolves the bearer token to a user id.
 *
 * Per RealWorld the scheme word is `Token` (`Authorization: Token <jwt>`);
 * `Bearer` is also accepted for client compatibility. On any problem it throws
 * {@link UnauthorizedError}, which Express forwards to the error handler as a
 * 401 — auth is enforced at the router seam, never inside business handlers
 * (api.md).
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../errors/AppError.js';
import type { ITokenService } from '../../services/ports/ITokenService.js';

const ACCEPTED_SCHEMES = new Set(['token', 'bearer']);

/**
 * Extract the credential from an `Authorization` header.
 *
 * Shared by {@link authenticate} (which rejects when absent) and
 * `optionalAuthenticate` (which falls back to anonymous), so the accepted
 * schemes and parsing live in one place.
 *
 * @param header - the raw `Authorization` header value, if any.
 * @returns the bearer token, or `null` when the header is missing/malformed.
 */
export function readBearerToken(header: string | undefined): string | null {
  if (header === undefined || header.length === 0) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme === undefined || !ACCEPTED_SCHEMES.has(scheme.toLowerCase()) || !token) {
    return null;
  }
  return token;
}

/**
 * Build the authentication middleware.
 *
 * @param tokens - the token service used to verify the credential.
 * @returns an Express middleware that attaches `req.userId` or throws 401.
 */
export function authenticate(tokens: ITokenService): RequestHandler {
  return (req, _res, next) => {
    const token = readBearerToken(req.header('authorization'));
    if (token === null) {
      throw new UnauthorizedError('Token is missing', { token: ['is missing'] });
    }
    req.userId = tokens.verify(token).userId;
    next();
  };
}
