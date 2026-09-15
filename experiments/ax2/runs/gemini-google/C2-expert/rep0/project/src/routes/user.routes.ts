import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IUserService, UserService } from '../services/user.service';
import { requireAuth, extractToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { HTTP_STATUS } from '../config/constants';
import { UnauthorizedError } from '../utils/error.util';

const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Email must be valid'),
    password: z.string().min(1, 'Password is required')
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email('Email must be valid'),
    password: z.string().min(1, 'Password is required')
  })
});

const updateSchema = z.object({
  user: z.object({
    email: z.string().email('Email must be valid').optional(),
    username: z.string().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(1, 'Password cannot be empty').optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional()
  })
});

/**
 * Creates user authentication and profile management router.
 *
 * @param {IUserService} [userService] - User service instance
 * @returns {Router} Configured Express router
 */
export function createUserRouter(userService: IUserService = new UserService()): Router {
  const router = Router();

  // POST /api/users (register)
  router.post(
    '/users',
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await userService.register(req.body.user);
        res.status(HTTP_STATUS.CREATED).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/users/login (login)
  router.post(
    '/users/login',
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await userService.login(req.body.user);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/user (current user)
  router.get(
    '/user',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const existingToken = extractToken(req) || undefined;
        const result = await userService.getCurrentUser(req.user.id, existingToken);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/user (update user)
  router.put(
    '/user',
    requireAuth,
    validateBody(updateSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const existingToken = extractToken(req) || undefined;
        const result = await userService.updateUser(req.user.id, req.body.user, existingToken);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
