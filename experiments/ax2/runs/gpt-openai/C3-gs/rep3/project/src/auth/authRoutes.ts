import { Router } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../errors/AppError';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from './AuthService';

const registerSchema = z.object({
  user: z.object({
    email: z.string().email(),
    username: z.string().min(1),
    password: z.string().min(8),
  }),
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const updateSchema = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(8).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url().nullable().optional(),
  }).refine((user) => Object.keys(user).length > 0, 'At least one field is required'),
});

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/** Creates authentication and current-user routes. */
export function createAuthRouter(
  service: AuthService,
  requireAuth: AuthMiddleware,
): Router {
  const router = Router();

  router.post('/users', async (request, response) => {
    const { user } = registerSchema.parse(request.body);
    response.status(201).json({ user: await service.register(user) });
  });

  router.post('/users/login', async (request, response) => {
    const { user } = loginSchema.parse(request.body);
    response.json({ user: await service.login(user) });
  });

  router.get('/user', requireAuth, async (request, response) => {
    const userId = requireUserId(request.auth?.userId);
    response.json({ user: await service.getCurrentUser(userId) });
  });

  router.put('/user', requireAuth, async (request, response) => {
    const userId = requireUserId(request.auth?.userId);
    const { user } = updateSchema.parse(request.body);
    response.json({ user: await service.updateUser(userId, user) });
  });

  return router;
}
