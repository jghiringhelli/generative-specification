import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

// Validation schema for update
const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    bio: z.string().optional(),
    image: z.string().url('Invalid image URL').optional()
  })
});

/**
 * Current user routes factory.
 */
export function createUserRoutes(authService: AuthService): Router {
  const router = Router();

  /**
   * GET /api/user - Get current user
   * Auth required
   */
  router.get('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/user - Update current user
   * Auth required
   */
  router.put('/user', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = updateUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const user = await authService.updateUser(req.user!.id, result.data.user);
      
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
