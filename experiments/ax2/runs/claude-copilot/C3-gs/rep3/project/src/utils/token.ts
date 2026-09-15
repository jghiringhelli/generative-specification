import pkg, { SignOptions } from 'jsonwebtoken';

const { sign, verify } = pkg;

/** Claims embedded in an issued access token. */
export interface TokenPayload {
  id: number;
  username: string;
}

/** Sign a JWT access token for the given user claims. */
export function generateToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: SignOptions['expiresIn'],
): string {
  const options: SignOptions = { expiresIn };
  return sign(payload, secret, options);
}

/** Verify a JWT and return its claims, throwing if invalid or expired. */
export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = verify(token, secret) as TokenPayload;
  return { id: decoded.id, username: decoded.username };
}
