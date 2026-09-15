import bcrypt from 'bcryptjs';

/** Cost factor for bcrypt hashing. Named to avoid a magic number. */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 * @param plainPassword the user-supplied password.
 * @returns the bcrypt hash.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * @param plainPassword the candidate password.
 * @param hashedPassword the stored bcrypt hash.
 * @returns true when the password matches.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
