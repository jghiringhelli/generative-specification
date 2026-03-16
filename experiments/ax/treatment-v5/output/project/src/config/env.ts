
/**
 * Environment variable configuration.
 * Validates and exports typed environment variables.
 * Fails fast on startup if required variables are missing.
 */

import type { SignOptions } from 'jsonwebtoken';

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRY: SignOptions['expiresIn'];
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
}

function validateEnv(): EnvConfig {
  const {
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRY,
    PORT,
    NODE_ENV,
    LOG_LEVEL,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  } = process.env;

  // Required variables
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for HS256 security');
  }

  // Cast JWT_EXPIRY using the pattern from CLAUDE.md § Known Type Pitfalls
  const jwtExpiry = (JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

  return {
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRY: jwtExpiry,
    PORT: PORT ? parseInt(PORT, 10) : 3000,
    NODE_ENV: (NODE_ENV as EnvConfig['NODE_ENV']) ?? 'development',
    LOG_LEVEL: (LOG_LEVEL as EnvConfig['LOG_LEVEL']) ?? 'info',
    RATE_LIMIT_MAX: RATE_LIMIT_MAX ? parseInt(RATE_LIMIT_MAX, 10) : 100,
    RATE_LIMIT_WINDOW_MS: RATE_LIMIT_WINDOW_MS
      ? parseInt(RATE_LIMIT_WINDOW_MS, 10)
      : 60000
  };
}

export const env = validateEnv();
