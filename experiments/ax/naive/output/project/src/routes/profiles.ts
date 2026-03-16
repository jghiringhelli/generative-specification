import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export const profileRoutes = Router();

profileRoutes.get('/:username', optionalAuth, profileController.getProfile);
profileRoutes.post('/:username/follow', requireAuth, profileController.followUser);
profileRoutes.delete('/:username/follow', requireAuth, profileController.unfollowUser);
