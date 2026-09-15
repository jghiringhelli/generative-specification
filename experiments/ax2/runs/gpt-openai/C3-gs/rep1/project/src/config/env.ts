import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

const DEFAULT_PORT = 3000;
const MINIMUM_SECRET_LENGTH = 32;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < MINIMUM_SECRET_LENGTH) {
  throw new Error(`JWT_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`);
}

export const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

export const env = Object.freeze({
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiry: JWT_EXPIRY,
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
