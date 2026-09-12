import { Response, NextFunction } from 'express';
import { ITokenService } from '../../infrastructure/security/JwtTokenService';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

/**
 * Express auth middleware.
 *
 * Expects the `Authorization: Token <jwt>` scheme (RealWorld convention, not
 * Bearer). The optional variant is used on public read endpoints so the
 * viewer's follow/favorite state can still be resolved. See CONDUIT-073.
 */
export class AuthMiddleware {
  constructor(private tokenService: ITokenService) {}

  /**
   * Hard gate: rejects the request when no valid token is present.
   * @throws {UnauthorizedError} rendered as a 401 response body
   */
  authenticate = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Token ')) {
      return res.status(401).json({ errors: { token: ['is missing'] } });
    }

    const token = authHeader.substring(6);

    try {
      const payload = this.tokenService.verify(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ errors: { token: ['is invalid'] } });
    }
  };

  optionalAuthenticate = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Token ')) {
      const token = authHeader.substring(6);
      try {
        const payload = this.tokenService.verify(token);
        req.user = payload;
      } catch (error) {
        // Token invalid, continue without auth
      }
    }

    next();
  };
}
