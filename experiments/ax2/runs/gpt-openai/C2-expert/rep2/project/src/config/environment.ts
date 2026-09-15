export interface EnvironmentConfig {
  readonly jwtSecret: string;
  readonly port: number;
}

const DEFAULT_PORT = 3000;

/** Loads and validates runtime configuration. */
export function loadEnvironment(): EnvironmentConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return { jwtSecret, port };
}
