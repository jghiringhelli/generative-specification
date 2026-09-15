import { SignOptions } from 'jsonwebtoken';

/**
 * Validated application configuration, loaded once at startup.
 *
 * Fails fast if required environment variables are missing.
 */
export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiry: SignOptions['expiresIn'];
  nodeEnv: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Build and validate the application config from the environment. */
export function loadConfig(): AppConfig {
  const jwtExpiry = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiry,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}
