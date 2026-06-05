/**
 * Environment configuration — validated once at startup, fail-fast.
 *
 * The composition root (`server.ts`) calls {@link loadConfig} before wiring
 * anything else; if a required variable is missing or malformed the process
 * refuses to boot rather than failing later at request time. Adapters receive
 * their configuration by injection — they never read `process.env` directly.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import { z } from 'zod';
import type { SignOptions } from 'jsonwebtoken';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // HS256 secret. ≥ 32 chars so the key has at least as much entropy as the
  // HMAC output it drives (see .claude/standards/protocols.md test-setup note).
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().min(1).default('7d'),
});

/** Fully validated, strongly-typed application configuration. */
export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiry: SignOptions['expiresIn'];
}

/**
 * Parse and validate the environment into an {@link AppConfig}.
 *
 * @param env - source environment (defaults to `process.env`); injectable for tests.
 * @returns the validated configuration.
 * @throws Error with a human-readable list of every invalid/missing variable.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const data = parsed.data;

  // Known Pitfall — jsonwebtoken `expiresIn` (see .claude/standards/protocols.md
  // § Known Pitfalls). `process.env.JWT_EXPIRY` is `string | undefined`, but
  // `SignOptions['expiresIn']` is a template-literal union (e.g. `"7d"` widened to
  // `${number}d`) plus `number` — a plain `string` is NOT assignable to it. The
  // value is already validated as a non-empty string above; cast through the
  // target type rather than weakening it to `any`.
  const jwtExpiry = data.JWT_EXPIRY as SignOptions['expiresIn'];

  return {
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    databaseUrl: data.DATABASE_URL,
    jwtSecret: data.JWT_SECRET,
    jwtExpiry,
  };
}
