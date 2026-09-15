import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { RequestWithUser } from '../middleware/auth';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * @param req - Express request with registration payload.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async register(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body || !req.body.user) {
        throw new ValidationError({ body: ["'user' object is required"] });
      }
      const user = await this.authService.register(req.body.user);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticates an existing user and returns a token.
   * @param req - Express request with login payload.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async login(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body || !req.body.user) {
        throw new ValidationError({ body: ["'user' object is required"] });
      }
      const user = await this.authService.login(req.body.user);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches the currently authenticated user.
   * @param req - Express request containing authenticated user data.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async getCurrentUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates fields for the currently authenticated user.
   * @param req - Express request containing update payload.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async updateUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      if (!req.body || !req.body.user) {
        throw new ValidationError({ body: ["'user' object is required"] });
      }
      const user = await this.authService.updateUser(req.user.id, req.body.user);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}
