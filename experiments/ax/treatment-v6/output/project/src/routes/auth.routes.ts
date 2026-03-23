import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/AuthService.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Creates and returns the auth/user router.
 * Routes: POST /api/users, POST /api/users/login, GET /api/user, PUT /api/user
 * @param authService - Injected auth service.
 */
export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  /** POST /api/users — register a new user */
  router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/users/login — login */
  router.post('/users/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body.user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/user — get current authenticated user */
  router.get('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.getCurrentUser(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  /** PUT /api/user — update current authenticated user */
  router.put('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.updateUser(req.userId!, req.body.user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
