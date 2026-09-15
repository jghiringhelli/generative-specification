import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000)
});

export type AppConfig = {
  readonly jwtSecret: string;
  readonly port: number;
};

/** Loads and validates application configuration from the environment. */
export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);
  return { jwtSecret: parsed.JWT_SECRET, port: parsed.PORT };
}
