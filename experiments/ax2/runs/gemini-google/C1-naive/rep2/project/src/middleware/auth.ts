import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../prisma';

export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      errors: { body: ['Unauthorized: missing token'] },
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || (parts[0] !== 'Token' && parts[0] !== 'Bearer')) {
    res.status(401).json({
      errors: { body: ['Unauthorized: invalid token format'] },
    });
    return;
  }

  const token = parts[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      errors: { body: ['Unauthorized: invalid or expired token'] },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user) {
    res.status(401).json({
      errors: { body: ['Unauthorized: user not found'] },
    });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
  };

  next();
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || (parts[0] !== 'Token' && parts[0] !== 'Bearer')) {
    return next();
  }

  const token = parts[1];
  const payload = verifyToken(token);
  if (!payload) {
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (user) {
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  next();
}
