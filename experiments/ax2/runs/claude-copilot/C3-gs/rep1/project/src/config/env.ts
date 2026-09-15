import dotenv from 'dotenv';

dotenv.config();

/**
 * Validated application configuration derived from environment variables.
 *
 * Fails fast at import time if a required value is missing.
 */
export interface AppConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiry: string;
  readonly port: number;
}

/**
 * Read a required environment variable or throw.
 * @param name - Environment variable name.
 * @returns The variable's value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Build the validated application configuration.
 * @returns The frozen application configuration.
 */
export function loadConfig(): AppConfig {
  return Object.freeze({
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
    port: Number(process.env.PORT ?? '3000'),
  });
}
