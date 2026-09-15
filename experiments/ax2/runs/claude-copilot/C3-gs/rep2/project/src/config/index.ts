import type { SignOptions } from 'jsonwebtoken';

/**
 * Validated application configuration, loaded once from the environment.
 * The app fails fast at startup if a required value is missing.
 */
export interface AppConfig {
  jwtSecret: string;
  jwtExpiry: SignOptions['expiresIn'];
  port: number;
}

/**
 * Read and validate configuration from environment variables.
 * @returns The validated configuration object.
 * @throws Error if a required variable is missing.
 */
export function loadConfig(): AppConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  // process.env.JWT_EXPIRY is `string | undefined` and is NOT directly
  // assignable to SignOptions['expiresIn'] — cast per CLAUDE.md § Known Type Pitfalls.
  const jwtExpiry = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);

  return { jwtSecret, jwtExpiry, port };
}
