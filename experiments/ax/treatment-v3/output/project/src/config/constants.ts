/**
 * Application-wide constants.
 * All magic numbers must be defined here with documentation.
 */

/** Argon2 time cost (iterations) - production-grade security */
export const ARGON2_TIME_COST = parseInt(process.env.ARGON2_TIME_COST || '3', 10);

/** Argon2 memory cost in KiB - balances security and performance */
export const ARGON2_MEMORY_COST = parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10);

/** Argon2 parallelism (threads) */
export const ARGON2_PARALLELISM = parseInt(process.env.ARGON2_PARALLELISM || '4', 10);

/** JWT token expiry duration */
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

/** Default pagination limit */
export const DEFAULT_LIMIT = 20;

/** Default pagination offset */
export const DEFAULT_OFFSET = 0;

/** Rate limit: requests per window */
export const RATE_LIMIT_MAX = 100;

/** Rate limit: window duration in minutes */
export const RATE_LIMIT_WINDOW_MINUTES = 1;
