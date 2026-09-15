import { Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService';
import { AuthRequest } from '../middleware/auth';
import { UnauthorizedError } from '../errors/AppError';

export class ProfileController {
  private readonly profileService: ProfileService;

  constructor(profileService: ProfileService) {
    this.profileService = profileService;
  }

  /**
   * Retrieves a user profile by username.
   * Route: GET /api/profiles/:username
   */
  public getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const profile = await this.profileService.getProfile(username, req.user?.id);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Follows a user by username.
   * Route: POST /api/profiles/:username/follow
   */
  public follow = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication token is required');
      }
      const { username } = req.params;
      const profile = await this.profileService.followUser(req.user.id, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unfollows a user by username.
   * Route: DELETE /api/profiles/:username/follow
   */
  public unfollow = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication token is required');
      }
      const { username } = req.params;
      const profile = await this.profileService.unfollowUser(req.user.id, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };
}
