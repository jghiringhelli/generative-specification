import { Router, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile-service';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { UnauthorizedError } from '../errors/http-error';

const router = Router();
const profileService = new ProfileService();

/**
 * GET /api/profiles/:username - Get user profile
 */
router.get(
  '/profiles/:username',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const profile = await profileService.getProfile(username, req.user?.userId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/profiles/:username/follow - Follow a user
 */
router.post(
  '/profiles/:username/follow',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { username } = req.params;
      const profile = await profileService.followUser(username, req.user.userId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/profiles/:username/follow - Unfollow a user
 */
router.delete(
  '/profiles/:username/follow',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { username } = req.params;
      const profile = await profileService.unfollowUser(username, req.user.userId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

export const profileRouter = router;
