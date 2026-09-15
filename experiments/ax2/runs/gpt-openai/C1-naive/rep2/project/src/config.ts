import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3000;

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
  port: Number(process.env.PORT ?? DEFAULT_PORT),
};
