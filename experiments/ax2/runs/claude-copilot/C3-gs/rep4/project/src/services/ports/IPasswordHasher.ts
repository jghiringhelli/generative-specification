/**
 * Port for password hashing and verification. Keeps the hashing library out of
 * the service layer.
 */
export interface IPasswordHasher {
  /** Hash a plaintext password, returning an encoded hash string. */
  hash(plain: string): Promise<string>;

  /** Verify a plaintext password against an encoded hash. */
  verify(hash: string, plain: string): Promise<boolean>;
}
