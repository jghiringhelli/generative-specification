import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { ProfileService } from '../services/ProfileService';

export class ProfileController {
  public constructor(private readonly profiles: ProfileService) {}

  /** Returns a profile by username. */
  public get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.profiles.get(request.params.username, request.userId);
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /** Follows a profile. */
  public follow = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.profiles.follow(request.params.username, this.userId(request));
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /** Unfollows a profile. */
  public unfollow = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.profiles.unfollow(request.params.username, this.userId(request));
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  };

  private userId(request: Request): string {
    if (!request.userId) throw new UnauthorizedError();
    return request.userId;
  }
}
