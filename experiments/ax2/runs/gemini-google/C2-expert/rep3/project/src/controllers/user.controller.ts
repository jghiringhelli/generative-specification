import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';

/**
 * Controller handling user authentication and profile updates.
 */
export class UserController {
  private readonly userService: UserService;

  /**
   * Initializes UserController.
   *
   * @param {UserService} [userService] Service instance
   */
  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  /**
   * Handles user registration.
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.register(req.body.user);
      res.status(201).json({ user: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles user login.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.login(req.body.user);
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles getting the current authenticated user.
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      const result = await this.userService.getCurrentUser(userId, token);
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles updating the current authenticated user.
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      const result = await this.userService.updateUser(userId, req.body.user, token);
      res.status(200).json({ user: result });
    } catch (error) {
      next(error);
    }
  };
}
