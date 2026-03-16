import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { ValidationError } from '../errors/AppError';

// Validation schemas
const registerSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(1, 'Username cannot be empty'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password cannot be empty')
  })
});

/**
 * Authentication routes factory.
 * Creates router with injected service dependency.
 */
export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  /**
   * POST /api/users - Register new user
   */
  router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = registerSchema.safeParse(req.body);
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const user = await authService.register(result.data.user);
      
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/users/login - Authenticate user
   */
  router.post('/users/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const user = await authService.login(result.data.user);
      
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
