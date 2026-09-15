import { Router } from 'express';
import { getProfile, followUser, unfollowUser } from '../controllers/profiles.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// GET /api/profiles/:username — get a profile
router.get('/profiles/:username', optionalAuth, asyncHandler(getProfile));
// POST /api/profiles/:username/follow — follow a user
router.post('/profiles/:username/follow', requireAuth, asyncHandler(followUser));
// DELETE /api/profiles/:username/follow — unfollow a user
router.delete('/profiles/:username/follow', requireAuth, asyncHandler(unfollowUser));

export default router;
