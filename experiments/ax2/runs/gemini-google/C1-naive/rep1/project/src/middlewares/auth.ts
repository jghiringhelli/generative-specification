import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
    token?: string;
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  return parts.length === 1 ? parts[0] : null;
}

export async function authRequired(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ errors: { message: ['Authentication required'] } });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ errors: { message: ['Invalid or expired token'] } });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });

  if (!user) {
    res.status(401).json({ errors: { message: ['User not found'] } });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    token
  };

  next();
}

export async function authOptional(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (payload) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token
      };
    }
  }

  next();
}
