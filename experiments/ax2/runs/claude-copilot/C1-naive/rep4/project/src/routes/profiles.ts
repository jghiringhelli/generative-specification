import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { toProfileResponse } from '../utils/view';
import { notFound, unprocessable } from '../utils/errors';

const router = Router();

async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
}

// GET /api/profiles/:username — get a profile
router.get('/profiles/:username', optionalAuth, async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) throw notFound('Profile not found');

  const following = req.user ? await isFollowing(req.user.id, target.id) : false;
  res.json(toProfileResponse(target, following));
});

// POST /api/profiles/:username/follow — follow a user
router.post('/profiles/:username/follow', requireAuth, async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) throw notFound('Profile not found');
  if (target.id === req.user!.id) throw unprocessable({ user: ['cannot follow yourself'] });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user!.id, followingId: target.id } },
    create: { followerId: req.user!.id, followingId: target.id },
    update: {},
  });

  res.json(toProfileResponse(target, true));
});

// DELETE /api/profiles/:username/follow — unfollow a user
router.delete('/profiles/:username/follow', requireAuth, async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) throw notFound('Profile not found');

  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followingId: target.id },
  });

  res.json(toProfileResponse(target, false));
});

export default router;
