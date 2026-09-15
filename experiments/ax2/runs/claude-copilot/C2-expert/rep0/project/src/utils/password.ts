import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config';

/**
 * Hashes a plaintext password using bcrypt with the configured cost factor.
 * @param plainPassword The plaintext password to hash.
 * @returns A promise resolving to the bcrypt hash.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * @param plainPassword The plaintext password to check.
 * @param hashedPassword The stored bcrypt hash.
 * @returns A promise resolving to `true` when the password matches.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
