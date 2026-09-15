import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { toUserResponse } from '../services/user.presenter';
import { registerSchema, loginSchema, updateUserSchema } from '../validators/user.schemas';

/**
 * Builds the user/auth router. Handlers are thin: validate then delegate.
 * @param authService the injected authentication service.
 * @returns an Express router.
 */
export function createUserRouter(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/users',
    asyncHandler(async (req, res) => {
      const { user } = registerSchema.parse(req.body);
      const created = await authService.register(user);
      res.status(201).json(toUserResponse(created));
    })
  );

  router.post(
    '/users/login',
    asyncHandler(async (req, res) => {
      const { user } = loginSchema.parse(req.body);
      const authenticated = await authService.login(user);
      res.status(200).json(toUserResponse(authenticated));
    })
  );

  router.get(
    '/user',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = await authService.getCurrentUser(req.user!.id);
      res.status(200).json(toUserResponse(user));
    })
  );

  router.put(
    '/user',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { user } = updateUserSchema.parse(req.body);
      const updated = await authService.updateUser(req.user!.id, user);
      res.status(200).json(toUserResponse(updated));
    })
  );

  return router;
}
