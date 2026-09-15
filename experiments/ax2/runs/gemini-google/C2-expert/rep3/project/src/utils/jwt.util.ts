import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN } from '../config/constants';
import { getEnvConfig } from '../config/env';
import { UnauthorizedError } from '../errors/app-error';
import { AuthUserPayload } from '../types/auth.types';

/**
 * Signs a JWT token containing the user payload.
 *
 * @param {AuthUserPayload} payload User identification payload
 * @returns {string} Signed JWT token string
 */
export function signToken(payload: AuthUserPayload): string {
  const { jwtSecret } = getEnvConfig();
  return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param {string} token JWT token string
 * @returns {AuthUserPayload} Decoded user payload
 * @throws {UnauthorizedError} When token is invalid or expired
 */
export function verifyToken(token: string): AuthUserPayload {
  const { jwtSecret } = getEnvConfig();
  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
