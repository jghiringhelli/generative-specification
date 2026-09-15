import { Router } from 'express';
import { ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

/**
 * Builds the profiles router.
 * @param profileService the injected profile service.
 * @returns an Express router.
 */
export function createProfileRouter(profileService: ProfileService): Router {
  const router = Router();

  router.get(
    '/profiles/:username',
    optionalAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const profile = await profileService.getProfile(req.params.username, req.user?.id);
      res.status(200).json(profile);
    })
  );

  router.post(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const profile = await profileService.follow(req.params.username, req.user!.id);
      res.status(200).json(profile);
    })
  );

  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const profile = await profileService.unfollow(req.params.username, req.user!.id);
      res.status(200).json(profile);
    })
  );

  return router;
}
