import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthenticationError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-tests';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

export interface JwtPayload {
  userId: number;
}

/**
 * Sign a JWT token with user ID payload.
 * @param userId - User ID to encode in token
 * @returns Signed JWT token string
 */
export function signToken(userId: number): string {
  const payload: JwtPayload = { userId };
  const options: SignOptions = { expiresIn: JWT_EXPIRY };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token.
 * @param token - Token string to verify
 * @returns Decoded payload
 * @throws AuthenticationError if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}
