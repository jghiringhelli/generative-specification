import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000)
});

export type AppConfig = z.infer<typeof environmentSchema>;

/** Reads and validates application configuration from the environment. */
export function loadConfig(): AppConfig {
  return environmentSchema.parse(process.env);
}
