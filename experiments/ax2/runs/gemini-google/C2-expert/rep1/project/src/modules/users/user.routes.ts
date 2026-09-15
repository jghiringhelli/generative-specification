import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { registerUserSchema, loginUserSchema, updateUserSchema } from './user.dto';
import { validateBody } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

export function createUsersRouter(userService: UserService = new UserService()): Router {
  const router = Router();

  router.post(
    '/',
    validateBody(registerUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.register(req.body);
        res.status(201).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/login',
    validateBody(loginUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.login(req.body);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export function createUserRouter(userService: UserService = new UserService()): Router {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.getCurrentUser(req.user!.id);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/',
    requireAuth,
    validateBody(updateUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.updateUser(req.user!.id, req.body);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
