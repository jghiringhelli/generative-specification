import { Router, Response } from 'express';
import prisma from '../prisma';
import { toProfileResponse } from '../utils/serializers';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
}

// GET /api/profiles/:username — get a profile
router.get('/profiles/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  const following = req.user ? await isFollowing(req.user.id, user.id) : false;
  return res.json(toProfileResponse(user, following));
});

// POST /api/profiles/:username/follow — follow a user
router.post('/profiles/:username/follow', auth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  if (user.id !== req.user!.id) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.user!.id, followingId: user.id } },
      update: {},
      create: { followerId: req.user!.id, followingId: user.id },
    });
  }
  return res.json(toProfileResponse(user, true));
});

// DELETE /api/profiles/:username/follow — unfollow a user
router.delete('/profiles/:username/follow', auth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followingId: user.id },
  });
  return res.json(toProfileResponse(user, false));
});

export default router;
