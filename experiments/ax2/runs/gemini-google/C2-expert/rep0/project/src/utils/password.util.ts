import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config/constants';

/**
 * Hashes a plaintext password using bcryptjs.
 *
 * @param {string} password - Raw plaintext password to hash
 * @returns {Promise<string>} Salted password hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 *
 * @param {string} password - Raw plaintext password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
