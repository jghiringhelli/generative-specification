import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';

/**
 * Creates and configures routes for profile operations.
 *
 * @param {ProfileController} [controller] Optional controller instance
 * @returns {Router} Express router instance
 */
export function createProfileRouter(
  controller: ProfileController = new ProfileController()
): Router {
  const router = Router();

  router.get('/profiles/:username', optionalAuth, controller.getProfile);
  router.post('/profiles/:username/follow', requireAuth, controller.followUser);
  router.delete('/profiles/:username/follow', requireAuth, controller.unfollowUser);

  return router;
}
