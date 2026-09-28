import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const token = authHeader.substring(6);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ errors: { body: ['Invalid token'] } });
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Token ')) {
    const token = authHeader.substring(6);
    try {
      const payload = verifyToken(token);
      req.user = payload;
    } catch (error) {
      // Token invalid, continue without auth
    }
  }

  next();
};
