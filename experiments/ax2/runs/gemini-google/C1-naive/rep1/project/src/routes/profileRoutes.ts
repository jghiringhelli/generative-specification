import { Router } from 'express';
import { getProfile, followUser, unfollowUser } from '../controllers/profileController';
import { authRequired, authOptional } from '../middlewares/auth';

const router = Router();

// /api/profiles/:username
router.get('/profiles/:username', authOptional, getProfile);
router.post('/profiles/:username/follow', authRequired, followUser);
router.delete('/profiles/:username/follow', authRequired, unfollowUser);

export default router;
