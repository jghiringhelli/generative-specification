import jwt from "jsonwebtoken";

export const TOKEN_EXPIRY = "30d";

export interface TokenPayload {
  readonly userId: number;
}

/** Signs an authentication token for a user. */
export function signToken(userId: number, secret: string): string {
  return jwt.sign({ userId }, secret, { expiresIn: TOKEN_EXPIRY });
}

/** Verifies an authentication token. */
export function verifyToken(token: string, secret: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
