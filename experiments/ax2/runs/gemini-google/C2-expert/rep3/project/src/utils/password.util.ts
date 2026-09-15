import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config/constants';

/**
 * Hashes a plaintext password using bcryptjs.
 *
 * @param {string} password The plaintext password to hash
 * @returns {Promise<string>} The hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a hashed password.
 *
 * @param {string} password The plaintext password to test
 * @param {string} hash The stored hashed password
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
