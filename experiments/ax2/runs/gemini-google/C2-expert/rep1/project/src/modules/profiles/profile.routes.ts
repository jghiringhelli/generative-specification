import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';

export function createProfilesRouter(profileService: ProfileService = new ProfileService()): Router {
  const router = Router();

  router.get(
    '/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.params.username;
        const currentUserId = req.user?.id;
        const profile = await profileService.getProfile(username, currentUserId);
        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.params.username;
        const currentUserId = req.user!.id;
        const profile = await profileService.followUser(username, currentUserId);
        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.params.username;
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
