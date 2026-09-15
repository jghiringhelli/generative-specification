import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'default_jwt_secret_must_change_in_production',
  jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
};
