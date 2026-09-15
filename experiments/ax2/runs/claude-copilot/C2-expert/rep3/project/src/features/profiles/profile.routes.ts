import { Router } from 'express';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const profileRepository = new ProfileRepository();
const profileService = new ProfileService(profileRepository);

export const profilesRouter = Router();

profilesRouter.get(
  '/profiles/:username',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const result = await profileService.getProfile(
      req.params.username,
      req.user?.id,
    );
    res.status(200).json(result);
  }),
);

profilesRouter.post(
  '/profiles/:username/follow',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await profileService.followUser(
      req.params.username,
      req.user!.id,
    );
    res.status(200).json(result);
  }),
);

profilesRouter.delete(
  '/profiles/:username/follow',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await profileService.unfollowUser(
      req.params.username,
      req.user!.id,
    );
    res.status(200).json(result);
  }),
);
