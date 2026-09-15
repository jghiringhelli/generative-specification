// src/routes/profileRoutes.ts
import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export function createProfileRouter(profileController: ProfileController): Router {
  const router = Router();

  router.get('/profiles/:username', optionalAuth, profileController.getProfile);
  router.post('/profiles/:username/follow', requireAuth, profileController.followUser);
  router.delete('/profiles/:username/follow', requireAuth, profileController.unfollowUser);

  return router;
}
