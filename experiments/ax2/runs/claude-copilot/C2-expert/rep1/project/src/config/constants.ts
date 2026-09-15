/**
 * Application-wide constants. No magic numbers should appear in business logic.
 */

/** Number of bcrypt salt rounds used to hash passwords. */
export const BCRYPT_SALT_ROUNDS = 12;

/** JWT expiry window expressed for jsonwebtoken (30 days). */
export const JWT_EXPIRY = '30d';

/** Default number of articles returned by list endpoints. */
export const DEFAULT_LIMIT = 20;

/** Default article list offset. */
export const DEFAULT_OFFSET = 0;
