import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { isFollowing, toProfile } from '../utils/profile';

const router = Router();

// GET /api/profiles/:username
router.get(
  '/:username',
  optionalAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: req.params.username },
      });
      if (!user) throw new HttpError(404, 'Profile not found');
      const following = await isFollowing(req.user?.id, user.id);
      res.json({ profile: toProfile(user, following) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/profiles/:username/follow
router.post(
  '/:username/follow',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const target = await prisma.user.findUnique({
        where: { username: req.params.username },
      });
      if (!target) throw new HttpError(404, 'Profile not found');
      if (target.id === req.user!.id)
        throw new HttpError(422, 'You cannot follow yourself');

      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: req.user!.id,
            followingId: target.id,
          },
        },
        create: { followerId: req.user!.id, followingId: target.id },
        update: {},
      });
      res.json({ profile: toProfile(target, true) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/profiles/:username/follow
router.delete(
  '/:username/follow',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const target = await prisma.user.findUnique({
        where: { username: req.params.username },
      });
      if (!target) throw new HttpError(404, 'Profile not found');

      await prisma.follow.deleteMany({
        where: { followerId: req.user!.id, followingId: target.id },
      });
      res.json({ profile: toProfile(target, false) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
