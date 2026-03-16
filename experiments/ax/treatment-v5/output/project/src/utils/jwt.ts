
/**
 * JWT utility functions.
 * Centralized JWT signing and verification.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/AppError';

export interface JwtPayload {
  userId: number;
}

/**
 * Sign a JWT token with user ID payload.
 * @param userId - User ID to encode in token
 * @returns Signed JWT string
 */
export function signToken(userId: number): string {
  const payload: JwtPayload = { userId };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY
  });
}

/**
 * Verify and decode a JWT token.
 * @param token - JWT string to verify
 * @returns Decoded payload with userId
 * @throws UnauthorizedError if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    if (!decoded.userId || typeof decoded.userId !== 'number') {
      throw new UnauthorizedError('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    // jwt.verify throws JsonWebTokenError, TokenExpiredError, etc.
    throw new UnauthorizedError('Invalid or expired token');
  }
}
