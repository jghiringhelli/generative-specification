import { Router } from 'express';
import { Container } from '../container';
import { requireAuth } from '../middleware/auth';
import { toUserView } from '../dtos/userView';
import { requireUserId } from '../controllers/requestHelpers';

/**
 * Build the router for user registration, login, and current-user endpoints.
 * @param container - Wired application services.
 * @returns An Express router mounted under /api.
 */
export function createUserRouter(container: Container): Router {
  const router = Router();
  const { authService } = container;

  router.post('/users', async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(toUserView(result.user, result.token));
  });

  router.post('/users/login', async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(toUserView(result.user, result.token));
  });

  router.get('/user', requireAuth, async (req, res) => {
    const result = await authService.getCurrentUser(requireUserId(req));
    res.status(200).json(toUserView(result.user, result.token));
  });

  router.put('/user', requireAuth, async (req, res) => {
    const result = await authService.updateUser(requireUserId(req), req.body);
    res.status(200).json(toUserView(result.user, result.token));
  });

  return router;
}
