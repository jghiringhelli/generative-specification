import pkg from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

// jsonwebtoken is CommonJS — import the default export and destructure to stay
// ESM-safe (CLAUDE.md § ESM-Safe Imports).
const { sign, verify } = pkg;

/** Claims embedded in an issued JWT. */
export interface TokenPayload {
  userId: number;
}

/**
 * Sign a JWT for an authenticated user.
 * @param userId - The user's id to embed as a claim.
 * @param secret - The signing secret.
 * @param expiresIn - Token lifetime.
 * @returns The signed JWT string.
 */
export function signToken(
  userId: number,
  secret: string,
  expiresIn: SignOptions['expiresIn'],
): string {
  const options: SignOptions = { expiresIn };
  return sign({ userId }, secret, options);
}

/**
 * Verify a JWT and extract its payload.
 * @param token - The JWT string.
 * @param secret - The signing secret.
 * @returns The decoded payload.
 * @throws Error if the token is invalid or expired.
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = verify(token, secret) as { userId: number };
  return { userId: decoded.userId };
}
