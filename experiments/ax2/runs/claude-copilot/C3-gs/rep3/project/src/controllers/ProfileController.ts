import { Request, Response } from 'express';
import { ProfileService } from '../services/ProfileService';

/** Thin driving adapter for profile endpoints. */
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const viewerId = req.userId ?? null;
    const result = await this.profiles.getProfile(req.params.username, viewerId);
    res.status(200).json(result);
  };

  follow = async (req: Request, res: Response): Promise<void> => {
    const result = await this.profiles.follow(
      req.params.username,
      req.userId as number,
    );
    res.status(200).json(result);
  };

  unfollow = async (req: Request, res: Response): Promise<void> => {
    const result = await this.profiles.unfollow(
      req.params.username,
      req.userId as number,
    );
    res.status(200).json(result);
  };
}
