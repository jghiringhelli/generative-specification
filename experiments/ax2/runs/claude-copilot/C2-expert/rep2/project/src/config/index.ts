import 'dotenv/config';

/**
 * Centralized, validated application configuration.
 * All values come from environment variables — no hardcoded secrets.
 */

const DEFAULT_PORT = 3000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface AppConfig {
  readonly jwtSecret: string;
  readonly port: number;
  readonly databaseUrl: string;
}

/**
 * Builds the application configuration from the environment.
 * @returns the validated {@link AppConfig}.
 */
export function loadConfig(): AppConfig {
  return {
    jwtSecret: requireEnv('JWT_SECRET'),
    databaseUrl: requireEnv('DATABASE_URL'),
    port: process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT
  };
}

export const config: AppConfig = loadConfig();
