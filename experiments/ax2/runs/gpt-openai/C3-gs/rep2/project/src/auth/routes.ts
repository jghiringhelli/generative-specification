import { Router } from 'express';
import { AuthService } from './AuthService';
import { TokenService } from './ports';
import { loginSchema, registerSchema, updateUserSchema } from './validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { UnauthorizedError } from '../errors/AppError';

function authenticatedUserId(userId: string | undefined): string {
  if (!userId) {
    throw new UnauthorizedError('Authentication is required');
  }
  return userId;
}

/** Creates authentication API routes. */
export function createAuthRouter(auth: AuthService, tokens: TokenService): Router {
  const router = Router();

  router.post('/users', asyncHandler(async (request, response) => {
    const { user } = registerSchema.parse(request.body);
    response.status(201).json({ user: await auth.register(user) });
  }));

  router.post('/users/login', asyncHandler(async (request, response) => {
    const { user } = loginSchema.parse(request.body);
    response.json({ user: await auth.login(user) });
  }));

  router.get('/user', requireAuth(tokens), asyncHandler(async (request, response) => {
    response.json({ user: await auth.getCurrentUser(authenticatedUserId(request.userId)) });
  }));

  router.put('/user', requireAuth(tokens), asyncHandler(async (request, response) => {
    const { user } = updateUserSchema.parse(request.body);
    response.json({
      user: await auth.updateUser(authenticatedUserId(request.userId), user),
    });
  }));

  return router;
}
