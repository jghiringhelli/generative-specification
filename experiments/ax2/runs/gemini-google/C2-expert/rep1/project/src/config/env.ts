export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
}

export const config: AppConfig = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/conduit?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
};
