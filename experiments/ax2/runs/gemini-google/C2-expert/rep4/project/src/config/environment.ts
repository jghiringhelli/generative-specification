/**
 * Environment configuration module.
 * Provides validated runtime settings.
 */
export interface EnvironmentConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly port: number;
}

/**
 * Retrieves and validates the application configuration.
 *
 * @returns {EnvironmentConfig} Validated application configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/conduit?schema=public';
  const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key';
  const portString = process.env.PORT || '3000';
  const port = parseInt(portString, 10);

  return {
    databaseUrl,
    jwtSecret,
    port: Number.isNaN(port) ? 3000 : port,
  };
}
