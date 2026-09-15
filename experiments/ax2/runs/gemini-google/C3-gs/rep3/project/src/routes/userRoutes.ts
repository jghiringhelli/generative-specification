// src/routes/userRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';

export function createUserRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/users', authController.register);
  router.post('/users/login', authController.login);
  router.get('/user', requireAuth, authController.getCurrentUser);
  router.put('/user', requireAuth, authController.updateUser);

  return router;
}
