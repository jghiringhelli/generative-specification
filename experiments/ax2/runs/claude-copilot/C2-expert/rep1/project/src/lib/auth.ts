import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRY } from '../config/constants';

/** Payload embedded in issued JWTs. */
export interface TokenPayload {
  readonly id: number;
  readonly username: string;
}

/**
 * Hashes a plaintext password using bcrypt.
 * @param password the plaintext password
 * @returns the bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * @param password the plaintext password
 * @param hash the stored bcrypt hash
 * @returns true when the password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT for the given payload.
 * @param payload the identity claims to embed
 * @param secret the signing secret
 * @returns the signed JWT string
 */
export function signToken(payload: TokenPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

/**
 * Verifies and decodes a JWT.
 * @param token the JWT string
 * @param secret the signing secret
 * @returns the decoded {@link TokenPayload}
 * @throws JsonWebTokenError when the token is invalid or expired
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  return { id: decoded.id as number, username: decoded.username as string };
}
