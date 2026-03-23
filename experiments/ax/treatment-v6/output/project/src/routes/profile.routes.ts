import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ProfileService } from '../services/ProfileService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

/**
 * Creates and returns the profiles router.
 * Routes: GET /api/profiles/:username, POST/DELETE /api/profiles/:username/follow
 * @param profileService - Injected profile service.
 */
export function createProfileRouter(profileService: ProfileService): Router {
  const router = Router();

  /** GET /api/profiles/:username — get a user's profile */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await profileService.getProfile(req.params['username']!, req.userId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** POST /api/profiles/:username/follow — follow a user */
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await profileService.followUser(req.userId!, req.params['username']!);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** DELETE /api/profiles/:username/follow — unfollow a user */
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await profileService.unfollowUser(req.userId!, req.params['username']!);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
