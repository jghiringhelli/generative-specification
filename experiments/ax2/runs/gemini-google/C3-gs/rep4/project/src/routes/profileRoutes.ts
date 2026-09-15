import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { authOptional, authRequired } from '../middleware/auth';

export function createProfileRouter(profileController: ProfileController): Router {
  const router = Router();

  router.get('/profiles/:username', authOptional, (req, res, next) =>
    profileController.getProfile(req, res, next)
  );

  router.post('/profiles/:username/follow', authRequired, (req, res, next) =>
    profileController.follow(req, res, next)
  );

  router.delete('/profiles/:username/follow', authRequired, (req, res, next) =>
    profileController.unfollow(req, res, next)
  );

  return router;
}
