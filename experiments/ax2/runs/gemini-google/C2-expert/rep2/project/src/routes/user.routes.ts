import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { userService } from '../services/user.service';
import { RequestWithUser } from '../types';

const router = Router();

const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'is required'),
    email: z.string().email('is invalid'),
    password: z.string().min(6, 'must be at least 6 characters')
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email('is invalid'),
    password: z.string().min(1, 'is required')
  })
});

const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('is invalid').optional(),
    username: z.string().min(1, 'cannot be empty').optional(),
    password: z.string().min(6, 'must be at least 6 characters').optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional()
  })
});

/**
 * POST /api/users - Register a new user
 */
router.post(
  '/users',
  validateBody(registerSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.register(req.body.user);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/login - Login existing user
 */
router.post(
  '/users/login',
  validateBody(loginSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.login(req.body.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/user - Get current user profile
 */
router.get(
  '/user',
  requireAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.getCurrentUser(req.userId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user - Update current user profile
 */
router.put(
  '/user',
  requireAuth,
  validateBody(updateUserSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.updateUser(req.userId!, req.body.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
