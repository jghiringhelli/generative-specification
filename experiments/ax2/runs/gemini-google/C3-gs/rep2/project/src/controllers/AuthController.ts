import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';
import { RegisterUserSchema, LoginUserSchema, UpdateUserSchema } from '../dtos/UserDTOs';
import { UnauthorizedError } from '../errors/AppError';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Registers a new user.
   * Route: POST /api/users
   */
  public register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = RegisterUserSchema.parse(req.body);
      const user = await this.authService.register(validated.user);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticates an existing user and returns a JWT token.
   * Route: POST /api/users/login
   */
  public login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = LoginUserSchema.parse(req.body);
      const user = await this.authService.login(validated.user);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets the currently authenticated user.
   * Route: GET /api/user
   */
  public getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication token is required');
      }
      const user = await this.authService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates user credentials and profile details.
   * Route: PUT /api/user
   */
  public updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication token is required');
      }
      const validated = UpdateUserSchema.parse(req.body);
      const user = await this.authService.updateUser(req.user.id, validated.user);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };
}
