import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRY: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Environment = z.infer<typeof environmentSchema>;

/** Validates and returns application environment configuration. */
export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  return environmentSchema.parse(source);
}
