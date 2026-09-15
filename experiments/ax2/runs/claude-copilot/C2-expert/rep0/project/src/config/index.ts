export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_EXPIRY = '30d';

export const DEFAULT_PAGINATION_LIMIT = 20;

export const DEFAULT_PAGINATION_OFFSET = 0;

/**
 * Reads and validates required environment configuration at startup.
 * @returns The validated application configuration object.
 */
export interface AppConfig {
  readonly jwtSecret: string;
  readonly port: number;
}

/**
 * Loads application configuration from environment variables, failing fast when
 * required values are missing.
 * @returns The validated {@link AppConfig}.
 */
export function loadConfig(): AppConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  return { jwtSecret, port };
}
