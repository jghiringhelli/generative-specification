import "dotenv/config";

import { z } from "zod";

const configurationSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export const configuration = configurationSchema.parse(process.env);
