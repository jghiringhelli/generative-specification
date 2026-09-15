import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { AppConfig } from '../config/config';

/** Wire profile routes to the profile controller. */
export function profileRoutes(
  controller: ProfileController,
  config: AppConfig,
): Router {
  const router = Router();
  router.get('/:username', optionalAuth(config), controller.get);
  router.post('/:username/follow', requireAuth(config), controller.follow);
  router.delete('/:username/follow', requireAuth(config), controller.unfollow);
  return router;
}
