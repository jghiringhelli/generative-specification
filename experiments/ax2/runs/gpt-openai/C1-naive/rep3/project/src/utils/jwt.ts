import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
}

export function createToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
