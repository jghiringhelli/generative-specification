/**
 * Port: password hashing boundary.
 *
 * Defined in the service layer so {@link UserService} depends on the capability,
 * not on a concrete algorithm. The Argon2id adapter lives in `adapters/security`
 * and is injected at the composition root (DIP).
 */
export interface IPasswordHasher {
  /**
   * Hash a plaintext password.
   *
   * @param plain - the user-supplied plaintext password.
   * @returns a self-describing hash string (algorithm + parameters embedded).
   */
  hash(plain: string): Promise<string>;

  /**
   * Verify a plaintext password against a stored hash.
   *
   * @param hash - a previously produced hash.
   * @param plain - the candidate plaintext password.
   * @returns `true` iff the password matches; `false` on mismatch or malformed hash.
   */
  verify(hash: string, plain: string): Promise<boolean>;
}
