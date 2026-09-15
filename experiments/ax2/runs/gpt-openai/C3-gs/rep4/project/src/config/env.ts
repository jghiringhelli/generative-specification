import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRY: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Environment = z.infer<typeof environmentSchema>;

/** Validates and returns process environment configuration. */
export function loadEnvironment(): Environment {
  return environmentSchema.parse(process.env);
}
