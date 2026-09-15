/**
 * Centralised, validated environment configuration.
 * Fails fast at startup if a required value is missing.
 */

/** Shape of the validated runtime configuration. */
export interface AppConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly port: number;
}

/**
 * Reads and validates configuration from process.env.
 * @returns the validated {@link AppConfig}
 * @throws Error when JWT_SECRET is missing
 */
export function loadConfig(): AppConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    databaseUrl: process.env.DATABASE_URL ?? '',
    jwtSecret,
    port: Number(process.env.PORT ?? 3000)
  };
}
