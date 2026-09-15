import jwt from 'jsonwebtoken';
import { JWT_EXPIRY } from '../config';

/** Payload embedded in signed authentication tokens. */
export interface TokenPayload {
  readonly id: number;
  readonly username: string;
}

/**
 * Signs a JWT for the given user payload.
 * @param payload The user identity to embed in the token.
 * @param secret The signing secret (from `process.env.JWT_SECRET`).
 * @returns The signed JWT string.
 */
export function signToken(payload: TokenPayload, secret: string): string {
  return jwt.sign({ id: payload.id, username: payload.username }, secret, {
    expiresIn: JWT_EXPIRY
  });
}

/**
 * Verifies and decodes a JWT.
 * @param token The JWT string to verify.
 * @param secret The signing secret (from `process.env.JWT_SECRET`).
 * @returns The decoded {@link TokenPayload}.
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  return { id: decoded.id as number, username: decoded.username as string };
}
