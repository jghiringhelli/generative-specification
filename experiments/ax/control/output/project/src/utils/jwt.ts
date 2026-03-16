import jwt from 'jsonwebtoken';
import { JWT_EXPIRY_SECONDS } from '../constants/auth';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface TokenPayload {
  userId: string;
}

export function signToken(userId: string): string {
  const payload: TokenPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY_SECONDS
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
