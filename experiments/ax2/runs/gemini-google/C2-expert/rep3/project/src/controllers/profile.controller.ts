import { NextFunction, Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';

/**
 * Controller handling user profiles and follow/unfollow operations.
 */
export class ProfileController {
  private readonly profileService: ProfileService;

  /**
   * Initializes ProfileController.
   *
   * @param {ProfileService} [profileService] Service instance
   */
  constructor(profileService: ProfileService = new ProfileService()) {
    this.profileService = profileService;
  }

  /**
   * Handles GET /api/profiles/:username
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;
      const profile = await this.profileService.getProfile(username, currentUserId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/profiles/:username/follow
   */
  followUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const currentUserId = req.user!.id;
      const profile = await this.profileService.followUser(currentUserId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/profiles/:username/follow
   */
  unfollowUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const currentUserId = req.user!.id;
      const profile = await this.profileService.unfollowUser(currentUserId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  };
}
