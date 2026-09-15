import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginUserSchema, registerUserSchema, updateUserSchema } from '../validators/user.validator';

/**
 * Creates and configures routes for user operations.
 *
 * @param {UserController} [controller] Optional controller instance
 * @returns {Router} Express router instance
 */
export function createUserRouter(controller: UserController = new UserController()): Router {
  const router = Router();

  router.post('/users', validateBody(registerUserSchema), controller.register);
  router.post('/users/login', validateBody(loginUserSchema), controller.login);
  router.get('/user', requireAuth, controller.getCurrentUser);
  router.put('/user', requireAuth, validateBody(updateUserSchema), controller.updateUser);

  return router;
}
