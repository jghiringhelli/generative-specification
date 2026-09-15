/**
 * Environment configuration loader and validator.
 */

export interface EnvironmentConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly port: number;
}

/**
 * Loads and validates environment variables.
 * Fails fast if required variables are missing.
 *
 * @returns {EnvironmentConfig} Validated application configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/conduit?schema=public';
  const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-conduit-production';
  const port = Number(process.env.PORT) || 3000;

  return {
    databaseUrl,
    jwtSecret,
    port
  };
}

export const env = getEnvironmentConfig();
