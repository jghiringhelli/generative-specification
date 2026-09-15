import { Router, Response, NextFunction } from 'express';
import {
  AuthService,
  RegisterInputSchema,
  LoginInputSchema,
  UpdateUserInputSchema,
} from '../services/auth-service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { UnauthorizedError } from '../errors/http-error';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/users - Register a new user
 */
router.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedInput = RegisterInputSchema.parse(req.body);
    const user = await authService.register(validatedInput);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/login - Authenticate existing user
 */
router.post('/users/login', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedInput = LoginInputSchema.parse(req.body);
    const user = await authService.login(validatedInput);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user - Get current user profile
 */
router.get('/user', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new UnauthorizedError();
    }
    const user = await authService.getCurrentUser(req.user.userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/user - Update current user profile
 */
router.put('/user', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new UnauthorizedError();
    }
    const validatedInput = UpdateUserInputSchema.parse(req.body);
    const user = await authService.updateUser(req.user.userId, validatedInput);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
