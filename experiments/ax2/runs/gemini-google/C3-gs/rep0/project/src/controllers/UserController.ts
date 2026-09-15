// src/controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class UserController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body?.user;
      if (!userData) {
        throw new ValidationError({ user: ["can't be blank"] });
      }

      const user = await this.authService.register(userData);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body?.user;
      if (!userData) {
        throw new ValidationError({ user: ["can't be blank"] });
      }

      const user = await this.authService.login(userData);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await this.authService.getCurrentUser(req.user.id, req.user.token);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const userData = req.body?.user;
      if (!userData) {
        throw new ValidationError({ user: ["can't be blank"] });
      }

      const user = await this.authService.updateUser(req.user.id, userData, req.user.token);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };
}
