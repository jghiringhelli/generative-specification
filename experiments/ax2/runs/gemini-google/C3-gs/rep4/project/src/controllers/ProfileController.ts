import { Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService';
import { RequestWithUser } from '../middleware/auth';
import { UnauthorizedError } from '../errors/AppError';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Fetches the public profile for a user.
   * @param req - Express request with username param.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async getProfile(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const username = req.params.username;
      const profile = await this.profileService.getProfile(username, req.user?.id);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Follows a user profile.
   * @param req - Express request with username param and authenticated user.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async follow(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const username = req.params.username;
      const profile = await this.profileService.followUser(req.user.id, username);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unfollows a user profile.
   * @param req - Express request with username param and authenticated user.
   * @param res - Express response.
   * @param next - Next middleware function.
   */
  async unfollow(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const username = req.params.username;
      const profile = await this.profileService.unfollowUser(req.user.id, username);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  }
}
