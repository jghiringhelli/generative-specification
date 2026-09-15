import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  getProfile,
  followUser,
  unfollowUser,
} from '../controllers/profileController';

const router = Router();

router.get('/profiles/:username', optionalAuth, getProfile);
router.post('/profiles/:username/follow', requireAuth, followUser);
router.delete('/profiles/:username/follow', requireAuth, unfollowUser);

export default router;
