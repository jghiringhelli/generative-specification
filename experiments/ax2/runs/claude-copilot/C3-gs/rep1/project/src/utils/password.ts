import argon2 from 'argon2';

/**
 * Hash a plaintext password using argon2id.
 * @param plaintext - The raw password to hash.
 * @returns The encoded argon2 hash.
 */
export function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext);
}

/**
 * Verify a plaintext password against an argon2 hash.
 * @param hash - The stored argon2 hash.
 * @param plaintext - The candidate password.
 * @returns True when the password matches.
 */
export function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return argon2.verify(hash, plaintext);
}
