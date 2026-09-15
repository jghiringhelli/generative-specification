import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRY } from '../../config/constants';
import { config } from '../../config/env';

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: JWT_EXPIRY
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
