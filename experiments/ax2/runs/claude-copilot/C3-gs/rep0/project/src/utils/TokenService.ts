/**
 * Shape of the payload encoded inside a Conduit JWT.
 */
export interface JwtPayload {
  userId: number;
}

/**
 * Port for issuing and verifying authentication tokens. Implemented in the
 * service/middleware layer using jsonwebtoken.
 */
export interface TokenService {
  /**
   * Issue a signed token for the given payload.
   * @param payload - The user identity to encode.
   * @returns The signed JWT string.
   */
  sign(payload: JwtPayload): string;

  /**
   * Verify and decode a token.
   * @param token - The JWT string.
   * @returns The decoded payload.
   * @throws If the token is invalid or expired.
   */
  verify(token: string): JwtPayload;
}
