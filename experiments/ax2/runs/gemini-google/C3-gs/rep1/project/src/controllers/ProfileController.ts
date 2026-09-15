import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService';
import { UnauthorizedError } from '../errors/AppError';

export class ProfileController {
  private readonly profileService: ProfileService;

  constructor(profileService: ProfileService) {
    this.profileService = profileService;
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;
      const profile = await this.profileService.getProfile(username, currentUserId);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };

  follow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { username } = req.params;
      const profile = await this.profileService.followUser(username, req.user.id);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };

  unfollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { username } = req.params;
      const profile = await this.profileService.unfollowUser(username, req.user.id);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  };
}
