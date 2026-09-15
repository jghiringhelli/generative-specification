import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import type { ProfileService } from '../services/profile.service';
import {
  optionalAuth,
  requireAuth,
  type AuthenticatedRequest
} from '../middleware/auth';

/**
 * Builds the router for profile viewing and follow endpoints.
 * @param profileService The profile service to delegate to.
 * @param jwtSecret The signing secret for the auth middleware.
 * @returns The configured Express router.
 */
export function createProfileRouter(
  profileService: ProfileService,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);
  const maybeAuth = optionalAuth(jwtSecret);

  router.get(
    '/:username',
    maybeAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const profile = await profileService.getProfile(
          req.params.username,
          req.userId
        );
        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/:username/follow',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const profile = await profileService.follow(
          req.params.username,
          req.userId as number
        );
        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:username/follow',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const profile = await profileService.unfollow(
          req.params.username,
          req.userId as number
        );
        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
