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

export function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ errors: { body: ['unauthorized'] } });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (e) {
    res.status(401).json({ errors: { body: ['unauthorized'] } });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
}
