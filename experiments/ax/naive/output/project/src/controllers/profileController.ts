import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.getProfile(username, req.userId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.followUser(username, req.userId!);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.unfollowUser(username, req.userId!);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}
