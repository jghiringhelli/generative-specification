
/**
 * Profile route handlers.
 * Thin layer: parse input, call service, return response.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  /**
   * GET /api/profiles/:username — Get profile (auth optional)
   */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user?.userId ?? null;

        const profile = await profileService.getProfile(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/profiles/:username/follow — Follow user (auth required)
   */
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.userId;

        const profile = await profileService.followUser(currentUserId, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/profiles/:username/follow — Unfollow user (auth required)
   */
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.userId;

        const profile = await profileService.unfollowUser(currentUserId, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
