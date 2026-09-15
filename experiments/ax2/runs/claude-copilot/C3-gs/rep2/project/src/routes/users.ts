import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { parseOrThrow, loginSchema, registerSchema, updateUserSchema } from '../validation/schemas';
import { requireUserId } from './helpers';

/**
 * Build the router for user/auth endpoints.
 * @param authService - The authentication service.
 * @param jwtSecret - JWT secret for the auth middleware.
 * @returns The configured router.
 */
export function createUserRouter(authService: AuthService, jwtSecret: string): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);

  router.post('/users', async (req, res) => {
    const { user } = parseOrThrow(registerSchema, req.body);
    const result = await authService.register(user);
    res.status(201).json({ user: result });
  });

  router.post('/users/login', async (req, res) => {
    const { user } = parseOrThrow(loginSchema, req.body);
    const result = await authService.login(user);
    res.status(200).json({ user: result });
  });

  router.get('/user', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const result = await authService.getCurrentUser(userId);
    res.status(200).json({ user: result });
  });

  router.put('/user', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const { user } = parseOrThrow(updateUserSchema, req.body);
    const result = await authService.updateUser(userId, user);
    res.status(200).json({ user: result });
  });

  return router;
}
