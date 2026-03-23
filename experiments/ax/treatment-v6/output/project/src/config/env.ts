import { z } from 'zod';

/** Zod schema for required environment variables. Fails fast at startup if missing. */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validated environment configuration.
 * Throws at module load time if required variables are missing or invalid.
 */
export const env = envSchema.parse(process.env);
