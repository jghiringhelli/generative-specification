import 'dotenv/config';

const DEFAULT_PORT = 3000;
const MINIMUM_SECRET_LENGTH = 32;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export interface AppConfig {
  readonly port: number;
  readonly jwtSecret: string;
}

export function loadConfig(): AppConfig {
  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`);
  }
  return { port: Number(process.env.PORT ?? DEFAULT_PORT), jwtSecret };
}
