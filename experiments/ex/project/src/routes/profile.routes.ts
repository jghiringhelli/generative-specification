import { Router, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';

/**
 * Create profile routes.
 */
export function createProfileRoutes(
  profileService: ProfileService,
  authService: AuthService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);
  const optionalAuth = createOptionalAuthMiddleware(authService);

  /**
   * GET /api/profiles/:username - Get user profile
   */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { username } = req.params;
        const profile = await profileService.getProfile(username, req.userId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/profiles/:username/follow - Follow user
   */
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { username } = req.params;
        const profile = await profileService.followUser(req.userId!, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/profiles/:username/follow - Unfollow user
   */
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { username } = req.params;
        const profile = await profileService.unfollowUser(req.userId!, username);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
