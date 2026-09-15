import dotenv from 'dotenv';
import { DEFAULT_PORT } from './constants';

dotenv.config();

export interface EnvironmentConfig {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
}

/**
 * Validates and retrieves current environment configuration.
 *
 * @returns {EnvironmentConfig} Validated environment config object
 */
export function getEnvConfig(): EnvironmentConfig {
  const databaseUrl = process.env.DATABASE_URL || '';
  const jwtSecret = process.env.JWT_SECRET || 'default-insecure-secret-for-test-only';
  const portString = process.env.PORT;
  const port = portString ? parseInt(portString, 10) : DEFAULT_PORT;

  return {
    databaseUrl,
    jwtSecret,
    port,
  };
}
