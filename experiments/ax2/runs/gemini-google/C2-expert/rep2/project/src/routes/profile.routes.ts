import { Router, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { profileService } from '../services/profile.service';
import { RequestWithUser } from '../types';

const router = Router();

/**
 * GET /api/profiles/:username - Get user profile
 */
router.get(
  '/profiles/:username',
  optionalAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await profileService.getProfile(req.params.username, req.userId);
      res.status(200).json(result);
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
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await profileService.followUser(req.params.username, req.userId!);
      res.status(200).json(result);
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
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await profileService.unfollowUser(req.params.username, req.userId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
