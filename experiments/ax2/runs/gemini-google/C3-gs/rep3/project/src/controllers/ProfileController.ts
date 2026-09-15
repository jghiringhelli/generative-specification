// src/controllers/ProfileController.ts
import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService';
import { UnauthorizedError } from '../errors/AppError';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;
      const profile = await this.profileService.getProfile(username, currentUserId);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };

  public follow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { username } = req.params;
      const profile = await this.profileService.follow(req.user.id, username);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };

  public unfollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { username } = req.params;
      const profile = await this.profileService.unfollow(req.user.id, username);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };
}
