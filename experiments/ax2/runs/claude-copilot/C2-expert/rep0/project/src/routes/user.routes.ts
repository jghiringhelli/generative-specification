import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '../services/auth.service';
import {
  requireAuth,
  type AuthenticatedRequest
} from '../middleware/auth';

/**
 * Builds the router for authentication and current-user endpoints.
 * @param authService The auth service to delegate to.
 * @param jwtSecret The signing secret for the auth middleware.
 * @returns The configured Express router.
 */
export function createUserRouter(
  authService: AuthService,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);

  router.post(
    '/users',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await authService.register(req.body);
        res.status(201).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/users/login',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await authService.login(req.body);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/user',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = await authService.getCurrentUser(req.userId as number);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/user',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = await authService.updateUser(
          req.userId as number,
          req.body
        );
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
