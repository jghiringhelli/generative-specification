/**
 * Port for issuing and verifying authentication tokens. Keeps the JWT library
 * out of the service layer so auth logic depends only on this abstraction.
 */
export interface ITokenService {
  /** Sign a token carrying the given subject user id. */
  sign(userId: string): string;

  /** Verify a token and return its subject user id, or throw on failure. */
  verify(token: string): string;
}
