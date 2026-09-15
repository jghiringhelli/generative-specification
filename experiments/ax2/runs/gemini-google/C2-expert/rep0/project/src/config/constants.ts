/**
 * Application constants.
 * Named constants prevent magic numbers and strings across the codebase.
 */

export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_EXPIRES_IN = '30d';

export const DEFAULT_PAGE_LIMIT = 20;

export const DEFAULT_PAGE_OFFSET = 0;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;
