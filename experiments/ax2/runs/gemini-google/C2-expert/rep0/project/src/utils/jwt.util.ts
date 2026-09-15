import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN } from '../config/constants';
import { env } from '../config/env';
import { UnauthorizedError } from './error.util';

export interface TokenPayload {
  readonly id: number;
  readonly username: string;
  readonly email: string;
}

/**
 * Signs a JWT token containing user identity claims.
 *
 * @param {TokenPayload} payload - Claims to encode in the token
 * @returns {string} Signed JWT token string
 */
export function signToken(payload: TokenPayload): string {
  const secretKey = process.env.JWT_SECRET || env.jwtSecret;
  return jwt.sign(payload, secretKey, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies and decodes a signed JWT token.
 *
 * @param {string} token - Signed JWT token string
 * @returns {TokenPayload} Decoded user claims
 * @throws {UnauthorizedError} When token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const secretKey = process.env.JWT_SECRET || env.jwtSecret;
    const decoded = jwt.verify(token, secretKey) as TokenPayload;
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
