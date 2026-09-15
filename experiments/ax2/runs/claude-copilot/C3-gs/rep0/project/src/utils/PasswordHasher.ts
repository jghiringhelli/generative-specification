import argon2 from 'argon2';

/**
 * Port for password hashing and verification. Keeps the hashing algorithm
 * behind an abstraction so services never depend on a concrete library.
 */
export interface PasswordHasher {
  /**
   * Hash a plaintext password.
   * @param plain - The plaintext password.
   * @returns The password hash.
   */
  hash(plain: string): Promise<string>;

  /**
   * Verify a plaintext password against a stored hash.
   * @param hash - The stored password hash.
   * @param plain - The plaintext password to check.
   * @returns True if the password matches.
   */
  verify(hash: string, plain: string): Promise<boolean>;
}

/**
 * argon2id-based password hasher (see ADR-0002).
 */
export class Argon2PasswordHasher implements PasswordHasher {
  /**
   * Hash a plaintext password with argon2id.
   * @param plain - The plaintext password.
   * @returns The password hash.
   */
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  /**
   * Verify a plaintext password against an argon2 hash.
   * @param hash - The stored password hash.
   * @param plain - The plaintext password to check.
   * @returns True if the password matches.
   */
  async verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
