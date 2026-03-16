import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, SECRET);
}

export function verifyToken(token: string): { userId: number } {
  try {
    return jwt.verify(token, SECRET) as { userId: number };
  } catch (error) {
    throw new Error('Invalid token');
  }
}
