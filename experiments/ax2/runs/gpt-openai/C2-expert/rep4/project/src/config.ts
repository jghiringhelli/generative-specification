export interface AppConfig {
  readonly jwtSecret: string;
  readonly port: number;
}

/** Loads and validates application configuration. */
export function loadConfig(): AppConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }

  return {
    jwtSecret,
    port: Number(process.env.PORT ?? "3000")
  };
}
