import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createProfileRoutes = (
  profileController: ProfileController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  router.get('/profiles/:username', authMiddleware.optionalAuthenticate, profileController.getProfile);
  router.post('/profiles/:username/follow', authMiddleware.authenticate, profileController.followUser);
  router.delete('/profiles/:username/follow', authMiddleware.authenticate, profileController.unfollowUser);

  return router;
};
