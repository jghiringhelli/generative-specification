import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 * @param plainPassword the raw password to hash
 * @returns the bcrypt hash
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * @param plainPassword the raw password to check
 * @param hash the stored bcrypt hash
 * @returns true when the password matches the hash
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
