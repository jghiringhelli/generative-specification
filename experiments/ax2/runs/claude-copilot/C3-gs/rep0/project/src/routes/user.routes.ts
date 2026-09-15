import { Request, Response, Router } from 'express';
import { AuthService } from '../services/AuthService';
import { requireAuth } from '../middleware/auth';
import { IUserRepository } from '../repositories/IUserRepository';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Retrieve the authenticated user from the request or fail. Used after
 * {@link requireAuth} has run.
 * @param req - The request.
 * @returns The authenticated user entity.
 */
function currentUser(req: Request): import('../domain/types').UserEntity {
  if (!req.user) {
    throw new UnauthorizedError('authorization required');
  }
  return req.user;
}

/**
 * Build the router for user/authentication endpoints.
 * @param authService - Authentication service.
 * @param jwtSecret - JWT signing secret (for auth middleware).
 * @param userRepository - User lookup port (for auth middleware).
 * @returns The configured router.
 */
export function createUserRouter(
  authService: AuthService,
  jwtSecret: string,
  userRepository: IUserRepository
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret, userRepository);

  router.post('/users', async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  });

  router.post('/users/login', async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  });

  router.get('/user', auth, async (req: Request, res: Response) => {
    const result = await authService.getCurrentUser(currentUser(req));
    res.status(200).json(result);
  });

  router.put('/user', auth, async (req: Request, res: Response) => {
    const result = await authService.updateUser(currentUser(req), req.body);
    res.status(200).json(result);
  });

  return router;
}
