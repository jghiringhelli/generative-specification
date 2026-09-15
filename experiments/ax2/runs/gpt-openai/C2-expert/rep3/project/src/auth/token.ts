import jwt from 'jsonwebtoken';

export const TOKEN_EXPIRY = '30d';

interface TokenPayload {
  readonly userId: number;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/** Signs a user authentication token. */
export function signToken(userId: number): string {
  return jwt.sign({ userId }, jwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

/** Verifies an authentication token and returns its payload. */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, jwtSecret()) as TokenPayload;
}
