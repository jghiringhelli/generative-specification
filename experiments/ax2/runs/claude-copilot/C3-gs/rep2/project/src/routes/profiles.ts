import { Router } from 'express';
import { ProfileService } from '../services/ProfileService';
import { AuthedRequest, optionalAuth, requireAuth } from '../middleware/auth';
import { requireUserId } from './helpers';

/**
 * Build the router for profile endpoints.
 * @param profileService - The profile service.
 * @param jwtSecret - JWT secret for auth middleware.
 * @returns The configured router.
 */
export function createProfileRouter(profileService: ProfileService, jwtSecret: string): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);
  const maybeAuth = optionalAuth(jwtSecret);

  router.get('/:username', maybeAuth, async (req: AuthedRequest, res) => {
    const profile = await profileService.getProfile(req.params.username, req.userId);
    res.status(200).json({ profile });
  });

  router.post('/:username/follow', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const profile = await profileService.follow(req.params.username, userId);
    res.status(200).json({ profile });
  });

  router.delete('/:username/follow', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const profile = await profileService.unfollow(req.params.username, userId);
    res.status(200).json({ profile });
  });

  return router;
}
