
/**
 * Authentication route handlers.
 * Thin layer: parse input, call service, return response.
 * No business logic. No direct database access.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  updateUserSchema
} from '../validators/auth.validator';
import { ValidationError } from '../errors/AppError';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  /**
   * POST /api/users — Register new user
   */
  router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { email, username, password } = parseResult.data.user;

      // Call service
      const user = await authService.register({ email, username, password });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/users/login — Authenticate user
   */
  router.post('/users/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { email, password } = parseResult.data.user;

      // Call service
      const user = await authService.login({ email, password });

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/user — Get current user (auth required)
   */
  router.get('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Call service
      const user = await authService.getCurrentUser(userId);

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/user — Update current user (auth required)
   */
  router.put('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const parseResult = updateUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const userId = req.user!.userId;
      const updates = parseResult.data.user;

      // Call service
      const user = await authService.updateUser(userId, updates);

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
