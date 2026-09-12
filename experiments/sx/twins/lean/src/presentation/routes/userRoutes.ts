import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createUserRoutes = (
  userController: UserController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  router.post('/users', userController.register);
  router.post('/users/login', userController.login);
  router.get('/user', authMiddleware.authenticate, userController.getCurrent);
  router.put('/user', authMiddleware.authenticate, userController.update);

  return router;
};
