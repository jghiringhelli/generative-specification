import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRATION_TIME } from '../config/constants';
import { getEnvironmentConfig } from '../config/environment';

export interface TokenPayload {
  readonly userId: string;
  readonly email: string;
}

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The resulting password hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a hash.
 *
 * @param {string} password - The plaintext password to verify
 * @param {string} hash - The stored password hash
 * @returns {Promise<boolean>} True if matching, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT token containing the user identity payload.
 *
 * @param {TokenPayload} payload - The user identity details to encode
 * @returns {string} The signed JWT string
 */
export function signToken(payload: TokenPayload): string {
  const config = getEnvironmentConfig();
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: JWT_EXPIRATION_TIME,
  });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token - The raw JWT token string
 * @returns {TokenPayload} The decoded user identity payload
 */
export function verifyToken(token: string): TokenPayload {
  const config = getEnvironmentConfig();
  const decoded = jwt.verify(token, config.jwtSecret);
  return decoded as TokenPayload;
}
