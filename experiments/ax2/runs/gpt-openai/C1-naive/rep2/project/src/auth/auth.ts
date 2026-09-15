import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError } from "../errors";

interface TokenPayload {
  sub: string;
}

/** Creates a JWT for an authenticated user. */
export function createToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: "7d" });
}

/** Verifies a JWT and returns its user identifier. */
export function verifyToken(token: string): number {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedError("Invalid token");
    }
    return userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError("Invalid token");
  }
}
