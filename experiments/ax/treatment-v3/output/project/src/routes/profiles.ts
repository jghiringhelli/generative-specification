import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

/**
 * Profile routes (user profiles and follows).
 * Thin layer: parse input, call service, format response.
 */
export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  /**
   * GET /api/profiles/:username - Get user profile (auth optional)
   */
  router.get(
    '/:username',
    optionalAuthenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user?.userId;

        const profile = await profileService.getProfile(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/profiles/:username/follow - Follow user (auth required)
   */
  router.post(
    '/:username/follow',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { username } = req.params;

        const profile = await profileService.followUser(req.user.userId, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/profiles/:username/follow - Unfollow user (auth required)
   */
  router.delete(
    '/:username/follow',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { username } = req.params;

        const profile = await profileService.unfollowUser(req.user.userId, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
