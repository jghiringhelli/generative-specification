const DEFAULT_PORT = 3000;

/**
 * Application configuration resolved from environment variables.
 * Fails fast at startup if a required secret is missing.
 */
export interface AppConfig {
  readonly jwtSecret: string;
  readonly port: number;
  readonly databaseUrl: string;
}

/**
 * Reads and validates configuration from process.env.
 * @returns the validated application configuration
 * @throws Error when JWT_SECRET is not set
 */
export function loadConfig(): AppConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
  const databaseUrl = process.env.DATABASE_URL ?? '';

  return { jwtSecret, port, databaseUrl };
}
