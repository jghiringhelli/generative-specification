// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.body || !req.body.user) {
        throw new ValidationError('Validation failed', {
          user: ["can't be blank"]
        });
      }

      const { email, username, password } = req.body.user;
      const user = await this.authService.register({ email, username, password });
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.body || !req.body.user) {
        throw new ValidationError('Validation failed', {
          user: ["can't be blank"]
        });
      }

      const { email, password } = req.body.user;
      const user = await this.authService.login({ email, password });
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  public getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      if (!req.body || !req.body.user) {
        throw new ValidationError('Validation failed', {
          user: ["can't be blank"]
        });
      }

      const { email, username, password, bio, image } = req.body.user;
      const user = await this.authService.updateUser(req.user.id, {
        email,
        username,
        password,
        bio,
        image
      });
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };
}
