import { Router } from 'express';
import { Container } from '../container';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { toProfileView } from '../dtos/profileView';
import { requireUserId } from '../controllers/requestHelpers';

/**
 * Build the router for profile viewing and follow/unfollow endpoints.
 * @param container - Wired application services.
 * @returns An Express router mounted under /api/profiles.
 */
export function createProfileRouter(container: Container): Router {
  const router = Router();
  const { profileService } = container;

  router.get('/:username', optionalAuth, async (req, res) => {
    const result = await profileService.getProfile(req.params.username, req.userId);
    res.status(200).json(toProfileView(result.user, result.following));
  });

  router.post('/:username/follow', requireAuth, async (req, res) => {
    const result = await profileService.follow(req.params.username, requireUserId(req));
    res.status(200).json(toProfileView(result.user, result.following));
  });

  router.delete('/:username/follow', requireAuth, async (req, res) => {
    const result = await profileService.unfollow(req.params.username, requireUserId(req));
    res.status(200).json(toProfileView(result.user, result.following));
  });

  return router;
}
