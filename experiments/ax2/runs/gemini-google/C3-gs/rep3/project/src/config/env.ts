// src/config/env.ts
import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://conduit_user:conduit_password@localhost:5432/conduit?schema=public';
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_change_me_in_production_environment_12345';
export const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
