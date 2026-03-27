import { Router } from 'express';
import type { ProfileService } from '../services/ProfileService';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Factory that constructs the profiles router with injected service dependency.
 *
 * Routes:
 *   GET    /profiles/:username        — get a user's public profile (auth optional)
 *   POST   /profiles/:username/follow — follow a user (auth required)
 *   DELETE /profiles/:username/follow — unfollow a user (auth required)
 *
 * @param profileService - Injected profile business-logic service
 * @returns Configured Express Router
 */
export function createProfileRouter(profileService: ProfileService): Router {
  const router = Router();

  // GET /api/profiles/:username — get profile (optional auth for following status)
  router.get(
    '/profiles/:username',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const profile = await profileService.getProfile(req.params.username, req.userId);
      res.status(200).json({ profile });
    }),
  );

  // POST /api/profiles/:username/follow — follow user (auth required)
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler(async (req, res) => {
      const profile = await profileService.followUser(req.userId!, req.params.username);
      res.status(200).json({ profile });
    }),
  );

  // DELETE /api/profiles/:username/follow — unfollow user (auth required)
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler(async (req, res) => {
      const profile = await profileService.unfollowUser(req.userId!, req.params.username);
      res.status(200).json({ profile });
    }),
  );

  return router;
}
