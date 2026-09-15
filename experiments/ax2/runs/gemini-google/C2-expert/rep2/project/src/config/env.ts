/**
 * Environment configuration reader with fallbacks.
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value !== undefined && value !== '') {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is required`);
};

export const config = {
  get databaseUrl(): string {
    return getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/conduit?schema=public');
  },
  get jwtSecret(): string {
    return getEnv('JWT_SECRET', 'super-secret-jwt-token-key-change-in-production');
  },
  get port(): number {
    return parseInt(getEnv('PORT', '3000'), 10);
  }
};
