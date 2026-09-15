import jwt from "jsonwebtoken";

import { configuration } from "./config";

interface TokenPayload {
  userId: number;
}

export function createToken(userId: number): string {
  return jwt.sign({ userId }, configuration.JWT_SECRET);
}

export function readToken(token: string): number {
  const payload = jwt.verify(token, configuration.JWT_SECRET) as TokenPayload;
  return payload.userId;
}
