import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

export function createProfileRouter(profileService: ProfileService): Router {
  const router = Router();

  /**
   * GET /api/profiles/:username - Get user profile
   * Auth optional - if authenticated, includes following status
   */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user?.userId;
        
        const result = await profileService.getProfile(username, currentUserId);
        res.status(200).json(result);
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
        const currentUserId = req.user!.userId;
        
        const result = await profileService.followUser(currentUserId, username);
        res.status(200).json(result);
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
        const currentUserId = req.user!.userId;
        
        const result = await profileService.unfollowUser(currentUserId, username);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
