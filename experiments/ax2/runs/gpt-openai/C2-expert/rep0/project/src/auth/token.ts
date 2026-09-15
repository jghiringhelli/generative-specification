import jwt from "jsonwebtoken";

export const TOKEN_EXPIRY = "30d";

export type TokenPayload = {
  readonly userId: number;
};

/** Signs an authentication token for a user. */
export function signToken(payload: TokenPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRY });
}

/** Verifies an authentication token and returns its payload. */
export function verifyToken(token: string, secret: string): TokenPayload {
  const payload = jwt.verify(token, secret);
  if (typeof payload === "string" || typeof payload.userId !== "number") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return { userId: payload.userId };
}
