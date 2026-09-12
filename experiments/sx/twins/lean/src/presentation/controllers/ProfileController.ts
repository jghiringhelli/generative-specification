import { Response } from 'express';
import { ProfileService } from '../../application/services/ProfileService';

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  getProfile = async (req: any, res: Response) => {
    try {
      const { username } = req.params;

      const profile = await this.profileService.getProfile(username, req.user?.id);

      if (!profile) {
        return res.status(404).json({
          errors: { profile: ['not found'] }
        });
      }

      return res.status(200).json({ profile });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  followUser = async (req: any, res: Response) => {
    try {
      const { username } = req.params;

      const profile = await this.profileService.followUser(username, req.user!.id);

      if (!profile) {
        return res.status(404).json({
          errors: { profile: ['not found'] }
        });
      }

      return res.status(200).json({ profile });
    } catch (error: any) {
      if (error.message === 'Cannot follow yourself') {
        return res.status(422).json({
          errors: { body: ['Cannot follow yourself'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  unfollowUser = async (req: any, res: Response) => {
    try {
      const { username } = req.params;

      const profile = await this.profileService.unfollowUser(username, req.user!.id);

      if (!profile) {
        return res.status(404).json({
          errors: { profile: ['not found'] }
        });
      }

      return res.status(200).json({ profile });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
