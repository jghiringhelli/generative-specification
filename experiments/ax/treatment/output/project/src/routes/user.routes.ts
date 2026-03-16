import { Router, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest, createAuthMiddleware } from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import {
  registerSchema,
  loginSchema,
  updateUserSchema
} from '../validation/auth.schemas';

/**
 * Create user/auth routes.
 */
export function createUserRoutes(authService: AuthService): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  /**
   * POST /api/users - Register new user
   */
  router.post('/users', async (req, res: Response, next) => {
    try {
      const result = registerSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { email, username, password } = result.data.user;
      const user = await authService.register({ email, username, password });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/users/login - Authenticate user
   */
  router.post('/users/login', async (req, res: Response, next) => {
    try {
      const result = loginSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { email, password } = result.data.user;
      const user = await authService.login({ email, password });

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/user - Get current user
   */
  router.get('/user', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await authService.getUserById(req.userId!);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/user - Update current user
   */
  router.put('/user', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = updateUserSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const user = await authService.updateUser(req.userId!, result.data.user);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
