
/**
 * Application-wide constants.
 * All values sourced from environment variables.
 */

export const PORT = parseInt(process.env.PORT || '3000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT configuration — validated at startup; cast to string after guard
const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
export const JWT_SECRET: string = _jwtSecret;
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

// Bcrypt configuration
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// Pagination defaults
export const DEFAULT_LIMIT = 20;
export const DEFAULT_OFFSET = 0;
export const MAX_LIMIT = 100;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;
