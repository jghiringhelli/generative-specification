import jwt, { JwtPayload } from 'jsonwebtoken';

export const TOKEN_EXPIRY = '30d';

export interface AuthenticationClaims extends JwtPayload {
  readonly userId: number;
}

/** Signs an authentication token for a user. */
export function signToken(userId: number, secret: string): string {
  return jwt.sign({ userId }, secret, { expiresIn: TOKEN_EXPIRY });
}

/** Verifies and decodes an authentication token. */
export function verifyToken(token: string, secret: string): AuthenticationClaims {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string' || typeof decoded.userId !== 'number') {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }
  return decoded as AuthenticationClaims;
}
