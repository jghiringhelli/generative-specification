import { Router } from 'express';
import { param } from 'express-validator';
import type { ITokenService } from '../auth/ITokenService';
import type { ProfileController } from '../controllers/ProfileController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export function createProfileRouter(controller: ProfileController, tokens: ITokenService): Router {
  const router = Router();
  const usernameValidation = [param('username').isString().trim().notEmpty(), validate];
  router.get('/profiles/:username', optionalAuth(tokens), usernameValidation, controller.get);
  router.post('/profiles/:username/follow', requireAuth(tokens), usernameValidation, controller.follow);
  router.delete('/profiles/:username/follow', requireAuth(tokens), usernameValidation, controller.unfollow);
  return router;
}
