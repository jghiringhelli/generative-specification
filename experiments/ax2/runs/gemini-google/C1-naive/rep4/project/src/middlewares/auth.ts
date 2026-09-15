import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0] === 'Token' || parts[0] === 'Bearer')) {
    return parts[1];
  }
  return null;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      errors: { body: ['Authorization token required'] }
    });
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      return res.status(401).json({
        errors: { body: ['User not found'] }
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
    next();
  } catch (err) {
    return res.status(401).json({
      errors: { body: ['Invalid or expired token'] }
    });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image
      };
    }
  } catch (err) {
    // If token is invalid, treat as unauthenticated
  }

  next();
}
