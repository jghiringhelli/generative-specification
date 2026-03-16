import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

/**
 * User routes (authentication and profile).
 * Thin layer: parse input, call service, format response.
 */
export function createUserRoutes(userService: UserService): Router {
  const router = Router();

  /**
   * POST /api/users - Register new user
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        user: z.object({
          email: z.string().email('Invalid email format'),
          username: z.string().min(1, 'Username cannot be empty'),
          password: z.string().min(8, 'Password must be at least 8 characters')
        })
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map(e => `${e.path.join('.')} ${e.message}`);
        throw new ValidationError(errors.join(', '));
      }

      const result = await userService.register(parsed.data.user);
      
      res.status(201).json({ user: result });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/users/login - Authenticate user
   */
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        user: z.object({
          email: z.string().email('Invalid email format'),
          password: z.string().min(1, 'Password cannot be empty')
        })
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map(e => `${e.path.join('.')} ${e.message}`);
        throw new ValidationError(errors.join(', '));
      }

      const result = await userService.login(parsed.data.user);
      
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/user - Get current user (auth required)
   */
  router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not attached by auth middleware');
      }

      const result = await userService.getCurrentUser(req.user.userId);
      
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/user - Update user (auth required)
   */
  router.put('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not attached by auth middleware');
      }

      const schema = z.object({
        user: z.object({
          email: z.string().email().optional(),
          username: z.string().min(1).optional(),
          password: z.string().min(8).optional(),
          bio: z.string().nullable().optional(),
          image: z.string().url().nullable().optional()
        })
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map(e => `${e.path.join('.')} ${e.message}`);
        throw new ValidationError(errors.join(', '));
      }

      const result = await userService.updateUser(req.user.userId, parsed.data.user);
      
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
