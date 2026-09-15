import { Request, Response, Router } from 'express';
import { AuthService } from '../services/AuthService';
import { ITokenService } from '../services/ports/ITokenService';
import { requireAuth } from '../middleware/auth';
import { requireUserId } from './helpers';
import {
  loginSchema,
  parseOrThrow,
  registerSchema,
  updateUserSchema,
} from '../validation/schemas';

/**
 * Build the authentication router (driving adapter). Handlers validate input and
 * delegate to {@link AuthService}; no business logic lives here.
 * @param auth the auth service.
 * @param tokens the token service used by the auth middleware.
 */
export function buildAuthRouter(auth: AuthService, tokens: ITokenService): Router {
  const router = Router();

  router.post('/users', async (req: Request, res: Response) => {
    const { user } = parseOrThrow(registerSchema, req.body);
    res.status(201).json(await auth.register(user));
  });

  router.post('/users/login', async (req: Request, res: Response) => {
    const { user } = parseOrThrow(loginSchema, req.body);
    res.status(200).json(await auth.login(user));
  });

  router.get('/user', requireAuth(tokens), async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    res.status(200).json(await auth.getCurrentUser(userId, req.token as string));
  });

  router.put('/user', requireAuth(tokens), async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { user } = parseOrThrow(updateUserSchema, req.body);
    res.status(200).json(await auth.updateUser(userId, user));
  });

  return router;
}
