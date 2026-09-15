import 'dotenv/config';

/**
 * Validated application configuration. Loaded once at startup; missing
 * required values fail fast.
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
 * @returns The value.
 */
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Build the validated application configuration from the environment.
 * @returns The application configuration.
 */
export function loadConfig(): AppConfig {
  return {
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
    port: Number(process.env.PORT ?? '3000')
  };
}

export const config: AppConfig = loadConfig();
