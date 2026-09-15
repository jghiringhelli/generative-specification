import jwt from "jsonwebtoken";

export const TOKEN_EXPIRY = "30d";

export interface TokenPayload {
  readonly userId: number;
}

/** Signs a JWT for an authenticated user. */
export function signToken(userId: number, secret: string): string {
  return jwt.sign({ userId }, secret, { expiresIn: TOKEN_EXPIRY });
}

/** Verifies a JWT and returns its typed payload. */
export function verifyToken(token: string, secret: string): TokenPayload {
  const payload = jwt.verify(token, secret);
  if (typeof payload === "string" || typeof payload.userId !== "number") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return { userId: payload.userId };
}
