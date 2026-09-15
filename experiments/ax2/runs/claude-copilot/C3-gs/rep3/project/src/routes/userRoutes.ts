import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';
import { AppConfig } from '../config/config';

/** Wire user/authentication routes to the auth controller. */
export function userRoutes(
  controller: AuthController,
  config: AppConfig,
): Router {
  const router = Router();
  router.post('/users', controller.register);
  router.post('/users/login', controller.login);
  router.get('/user', requireAuth(config), controller.current);
  router.put('/user', requireAuth(config), controller.update);
  return router;
}
