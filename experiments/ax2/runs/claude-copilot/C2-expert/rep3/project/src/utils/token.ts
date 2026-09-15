import jwt from 'jsonwebtoken';
import { loadConfig } from '../config';

const TOKEN_EXPIRY_DAYS = 30;
const TOKEN_EXPIRY = `${TOKEN_EXPIRY_DAYS}d`;

/** Payload embedded in a signed authentication token. */
export interface TokenPayload {
  readonly id: number;
  readonly username: string;
}

/**
 * Signs a JWT for the given user payload.
 * @param payload identifying user data to embed in the token
 * @returns a signed JWT string
 */
export function signToken(payload: TokenPayload): string {
  const { jwtSecret } = loadConfig();
  return jwt.sign({ id: payload.id, username: payload.username }, jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verifies and decodes a JWT.
 * @param token the JWT string to verify
 * @returns the decoded token payload
 * @throws JsonWebTokenError when the token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  const { jwtSecret } = loadConfig();
  const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
  return { id: decoded.id as number, username: decoded.username as string };
}
