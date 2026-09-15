import { Router } from 'express';
import { z } from 'zod';
import type { AuthService } from '../auth/AuthService';
import type { ITokenService } from '../auth/JwtTokenService';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1),
    email: z.string().email(),
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
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

/** Creates the authentication API router. */
export function createAuthRouter(auth: AuthService, tokens: ITokenService): Router {
  const router = Router();

  router.post('/users', validateBody(registerSchema), async (request, response, next) => {
    try {
      response.status(201).json({ user: await auth.register(request.body.user) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/users/login', validateBody(loginSchema), async (request, response, next) => {
    try {
      response.json({ user: await auth.login(request.body.user) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/user', requireAuth(tokens), async (request, response, next) => {
    try {
      response.json({ user: await auth.getCurrentUser(request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    '/user',
    requireAuth(tokens),
    validateBody(updateSchema),
    async (request, response, next) => {
      try {
        const user = await auth.updateCurrentUser(request.userId!, request.body.user);
        response.json({ user });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
