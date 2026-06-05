/**
 * Optional authentication middleware.
 *
 * For public endpoints whose response varies with the caller's identity (e.g.
 * GET profile, whose `following` flag depends on the viewer). When a valid
 * credential is present it attaches `req.userId`; when the header is absent,
 * malformed, or carries an invalid/expired token, the request proceeds
 * anonymously rather than failing — the endpoint is public by contract.
 *
 * @gs-links: docs/specs/profiles.md, docs/adrs/ADR-0002-auth.md
 */
import type { RequestHandler } from 'express';
import type { ITokenService } from '../../services/ports/ITokenService.js';
import { readBearerToken } from './authenticate.js';

/**
 * Build the optional-authentication middleware.
 *
 * @param tokens - the token service used to verify a credential when present.
 * @returns an Express middleware that attaches `req.userId` when a valid token
 *   is supplied and otherwise continues anonymously.
 */
export function optionalAuthenticate(tokens: ITokenService): RequestHandler {
  return (req, _res, next) => {
    const token = readBearerToken(req.header('authorization'));
    if (token !== null) {
      try {
        req.userId = tokens.verify(token).userId;
      } catch {
        // Optional auth: an invalid or expired token is treated as anonymous,
        // never a 401 — this endpoint is reachable without authentication.
      }
    }
    next();
  };
}
