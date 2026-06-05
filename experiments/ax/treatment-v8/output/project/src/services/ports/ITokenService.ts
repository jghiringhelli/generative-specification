/**
 * Port: authentication-token boundary.
 *
 * Services depend on this abstraction to mint and validate session tokens; the
 * JWT/HS256 implementation lives in `adapters/security` and is injected at the
 * composition root. The payload is intentionally minimal — only the subject id
 * travels in the token (ADR-0002: stateless, no server-side session store).
 */

/** The claims carried by an authentication token. */
export interface TokenPayload {
  readonly userId: string;
}

export interface ITokenService {
  /**
   * Issue a signed token for the given payload.
   *
   * @param payload - the claims to embed.
   * @returns a signed, URL-safe token string.
   */
  sign(payload: TokenPayload): string;

  /**
   * Verify and decode a token.
   *
   * @param token - the raw token string.
   * @returns the validated payload.
   * @throws UnauthorizedError if the token is missing, malformed, expired, or its
   *   signature does not verify.
   */
  verify(token: string): TokenPayload;
}
