import jwt from 'jsonwebtoken';
import { JWT_EXPIRATION_TIME } from '../config/constants';
import { config } from '../config/env';
import { JwtPayload } from '../types';

/**
 * Signs a JWT token containing user identity payload.
 */
export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || config.jwtSecret;
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRATION_TIME });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || config.jwtSecret;
  const decoded = jwt.verify(token, secret);
  return decoded as JwtPayload;
}
