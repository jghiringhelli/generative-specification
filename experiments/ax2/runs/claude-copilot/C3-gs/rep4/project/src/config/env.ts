import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Validated application configuration loaded once at startup. Missing required
 * values fail fast so the process never runs in a half-configured state.
 */
export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Build and validate the configuration object from the environment.
 * @returns the fully validated {@link AppConfig}.
 */
export function loadConfig(): AppConfig {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
  };
}
