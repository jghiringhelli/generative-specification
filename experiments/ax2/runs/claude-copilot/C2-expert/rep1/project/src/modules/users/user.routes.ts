import { Router, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { registerSchema, loginSchema, updateUserSchema } from './user.schemas';
import { parseOrThrow } from '../../lib/validation';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';

/**
 * Builds the users router. Thin driving adapter: validation + delegation only.
 * @param service injected {@link UserService}
 * @returns configured Express router
 */
export function createUserRouter(service: UserService): Router {
  const router = Router();

  router.post('/users', async (req, res, next) => {
    try {
      const input = parseOrThrow(registerSchema, req.body).user;
      res.status(201).json(await service.register(input));
    } catch (error) {
      next(error);
    }
  });

  router.post('/users/login', async (req, res, next) => {
    try {
      const input = parseOrThrow(loginSchema, req.body).user;
      res.status(200).json(await service.login(input));
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/user',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.getCurrentUser(req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/user',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const input = parseOrThrow(updateUserSchema, req.body).user;
        res.status(200).json(await service.updateUser(req.user!.id, input));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
