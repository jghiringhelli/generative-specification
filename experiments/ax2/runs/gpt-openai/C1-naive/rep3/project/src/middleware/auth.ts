import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

function extractToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (!token || scheme.toLowerCase() !== 'token') return null;
  return token;
}

async function authenticate(request: AuthenticatedRequest): Promise<boolean> {
  const token = extractToken(request.header('Authorization'));
  if (!token) return false;
  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return false;
  request.userId = user.id;
  return true;
}

export async function optionalAuth(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authenticate(request);
  } catch {
    request.userId = undefined;
  }
  next();
}

export async function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (await authenticate(request)) {
      next();
      return;
    }
  } catch {
    // The response below handles malformed and expired tokens.
  }
  response.status(401).json({ errors: { body: ['Authorization required'] } });
}
