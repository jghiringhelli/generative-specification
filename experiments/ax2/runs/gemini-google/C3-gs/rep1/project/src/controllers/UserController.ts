import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import {
  loginUserSchema,
  registerUserSchema,
  updateUserSchema,
} from '../validators/auth.validator';
import { UnauthorizedError } from '../errors/AppError';

export class UserController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerUserSchema.parse(req.body);
      const user = await this.authService.register(parsed.user);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginUserSchema.parse(req.body);
      const user = await this.authService.login(parsed.user);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const parsed = updateUserSchema.parse(req.body);
      const user = await this.authService.updateUser(req.user.id, parsed.user);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };
}
