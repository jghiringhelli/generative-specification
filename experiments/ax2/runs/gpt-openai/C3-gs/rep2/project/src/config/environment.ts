import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().min(1).default('7d'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Environment = z.infer<typeof environmentSchema>;

/** Reads and validates application configuration. */
export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(source);
}
