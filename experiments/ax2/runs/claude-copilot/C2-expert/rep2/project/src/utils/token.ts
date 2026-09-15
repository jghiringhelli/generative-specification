import jwt from 'jsonwebtoken';
import { config } from '../config';

/** JWT lifetime in seconds (30 days). Named to avoid a magic number. */
export const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

export interface TokenPayload {
  readonly id: number;
  readonly username: string;
}

/**
 * Signs a JWT for an authenticated user.
 * @param payload the user identity to embed.
 * @returns a signed JWT string.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign({ id: payload.id, username: payload.username }, config.jwtSecret, {
    expiresIn: TOKEN_EXPIRY_SECONDS
  });
}

/**
 * Verifies and decodes a JWT.
 * @param token the JWT string.
 * @returns the decoded {@link TokenPayload}.
 * @throws when the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  return { id: decoded.id as number, username: decoded.username as string };
}
