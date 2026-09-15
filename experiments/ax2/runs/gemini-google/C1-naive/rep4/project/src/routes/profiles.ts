import { Router } from 'express';
import {
  getProfile,
  followUser,
  unfollowUser
} from '../controllers/profileController';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/:username', optionalAuth, getProfile);
router.post('/:username/follow', requireAuth, followUser);
router.delete('/:username/follow', requireAuth, unfollowUser);

export default router;
