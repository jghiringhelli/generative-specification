// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';

export function createUserRouter(userController: UserController): Router {
  const router = Router();

  router.post('/users', userController.register);
  router.post('/users/login', userController.login);
  router.get('/user', requireAuth, userController.getCurrentUser);
  router.put('/user', requireAuth, userController.updateUser);

  return router;
}
