import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth } from '../middleware/auth';

/**
 * Profile routes factory.
 * Creates router with injected service dependency.
 */
export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  /**
   * GET /api/profiles/:username - Get user profile
   * Auth optional
   */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user?.id;

        const profile = await profileService.getProfile(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/profiles/:username/follow - Follow user
   * Auth required
   */
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.id;

        const profile = await profileService.followUser(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/profiles/:username/follow - Unfollow user
   * Auth required
   */
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.id;

        const profile = await profileService.unfollowUser(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
