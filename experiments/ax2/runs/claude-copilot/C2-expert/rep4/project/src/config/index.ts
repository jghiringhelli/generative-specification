/**
 * Central application configuration read from environment variables.
 * Fails fast if a required value is missing.
 */

/** Number of bcrypt salt rounds used when hashing passwords. */
export const BCRYPT_SALT_ROUNDS = 12;

/** JWT token expiry, expressed in seconds (30 days). */
export const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

/** Default pagination limit for article listings. */
export const DEFAULT_LIMIT = 20;

/** Default pagination offset for article listings. */
export const DEFAULT_OFFSET = 0;

/**
 * Resolve the JWT secret from the environment.
 * @returns The configured JWT secret string.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Resolve the HTTP port from the environment, defaulting to 3000.
 * @returns The port number the server should listen on.
 */
export function getPort(): number {
  return Number(process.env.PORT ?? 3000);
}
