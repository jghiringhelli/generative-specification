import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (!/^(Token|Bearer)$/i.test(scheme)) return null;
  return token;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ errors: { body: ['Unauthorized'] } });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}
