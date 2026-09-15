import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { AuthService } from '../services/AuthService';

export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  /** Handles user registration. */
  public register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.auth.register(request.body.user);
      response.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  /** Handles user login. */
  public login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.auth.login(request.body.user);
      response.json({ user });
    } catch (error) {
      next(error);
    }
  };

  /** Returns the current authenticated user. */
  public current = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.auth.getCurrentUser(this.requireUserId(request));
      response.json({ user });
    } catch (error) {
      next(error);
    }
  };

  /** Updates the current authenticated user. */
  public update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.auth.updateUser(this.requireUserId(request), request.body.user);
      response.json({ user });
    } catch (error) {
      next(error);
    }
  };

  private requireUserId(request: Request): string {
    if (!request.userId) throw new UnauthorizedError();
    return request.userId;
  }
}
