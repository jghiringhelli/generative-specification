import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';

/**
 * Creates and configures the authentication and user router.
 * @param authController The controller handling user authentication actions.
 * @returns Configured Express Router.
 */
export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  router.post('/users', authController.register);
  router.post('/users/login', authController.login);
  router.get('/user', requireAuth, authController.getCurrentUser);
  router.put('/user', requireAuth, authController.updateUser);

  return router;
}
