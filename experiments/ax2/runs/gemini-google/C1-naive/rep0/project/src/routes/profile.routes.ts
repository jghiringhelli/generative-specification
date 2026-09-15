import { Router } from 'express';
import {
  getProfile,
  followUser,
  unfollowUser
} from '../controllers/profile.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/profiles/:username', optionalAuth, getProfile);
router.post('/profiles/:username/follow', requireAuth, followUser);
router.delete('/profiles/:username/follow', requireAuth, unfollowUser);

export default router;
