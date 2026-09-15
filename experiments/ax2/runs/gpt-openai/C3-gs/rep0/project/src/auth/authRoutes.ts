import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from './AuthService';
import { asyncHandler } from '../http/asyncHandler';
import { authentication } from '../http/auth';
import { AuthenticatedRequest } from '../http/request';
import { validateBody } from '../http/validate';

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const registration = z.object({
  user: credentials.extend({ username: z.string().trim().min(1).max(50) }),
});
const login = z.object({ user: credentials });
const update = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().trim().min(1).max(50).optional(),
    password: z.string().min(8).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

export function createAuthRouter(service: AuthService): Router {
  const router = Router();
  const requireAuth = authentication(service, true);

  router.post('/users', validateBody(registration), asyncHandler(async (request, response) => {
    response.status(201).json({ user: await service.register(request.body.user) });
  }));
  router.post('/users/login', validateBody(login), asyncHandler(async (request, response) => {
    const { email, password } = request.body.user;
    response.json({ user: await service.login(email, password) });
  }));
  router.get('/user', requireAuth, asyncHandler(async (request, response) => {
    response.json({ user: await service.getCurrent((request as AuthenticatedRequest).userId) });
  }));
  router.put('/user', requireAuth, validateBody(update), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ user: await service.update(userId, request.body.user) });
  }));
  return router;
}
