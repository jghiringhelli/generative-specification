import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authRequired } from '../middleware/auth';

export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  router.post('/users', (req, res, next) => authController.register(req, res, next));
  router.post('/users/login', (req, res, next) => authController.login(req, res, next));
  router.get('/user', authRequired, (req, res, next) => authController.getCurrentUser(req, res, next));
  router.put('/user', authRequired, (req, res, next) => authController.updateUser(req, res, next));

  return router;
}
