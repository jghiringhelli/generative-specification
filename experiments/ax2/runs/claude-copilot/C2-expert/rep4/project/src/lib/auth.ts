import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRY_SECONDS, getJwtSecret } from "../config";

/** Shape of the payload embedded in a signed JWT. */
export interface TokenPayload {
  id: number;
  username: string;
}

/**
 * Hash a plaintext password using bcrypt.
 * @param plainPassword The raw password to hash.
 * @returns A bcrypt hash string.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * @param plainPassword The raw password to check.
 * @param hash The stored bcrypt hash.
 * @returns True when the password matches the hash.
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Sign a JWT for the given user payload.
 * @param payload The user identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY_SECONDS });
}

/**
 * Verify and decode a JWT.
 * @param token The JWT string to verify.
 * @returns The decoded token payload.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
  return { id: decoded.id as number, username: decoded.username as string };
}
