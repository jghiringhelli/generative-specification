import { Router, Request, Response, NextFunction } from 'express';
import { IProfileService, ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { HTTP_STATUS } from '../config/constants';
import { UnauthorizedError } from '../utils/error.util';

/**
 * Creates user profile routing handler.
 *
 * @param {IProfileService} [profileService] - Profile service instance
 * @returns {Router} Configured Express router
 */
export function createProfileRouter(
  profileService: IProfileService = new ProfileService()
): Router {
  const router = Router();

  // GET /api/profiles/:username
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const username = req.params.username;
        const currentUserId = req.user?.id;
        const result = await profileService.getProfile(username, currentUserId);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/profiles/:username/follow
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const username = req.params.username;
        const result = await profileService.followUser(req.user.id, username);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/profiles/:username/follow
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const username = req.params.username;
        const result = await profileService.unfollowUser(req.user.id, username);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
