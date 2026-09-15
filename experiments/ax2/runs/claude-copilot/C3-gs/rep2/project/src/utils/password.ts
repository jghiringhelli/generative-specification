import argon2 from 'argon2';

/**
 * Hash a plaintext password using argon2id.
 * @param plaintext - The raw password.
 * @returns The encoded hash string.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, { type: argon2.argon2id });
}

/**
 * Verify a plaintext password against a stored hash.
 * @param hash - The stored argon2 hash.
 * @param plaintext - The candidate password.
 * @returns True when the password matches.
 */
export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return argon2.verify(hash, plaintext);
}
