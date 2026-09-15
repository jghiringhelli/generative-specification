import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profiles/:username - Get a profile
router.get('/profiles/:username', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    res.status(404).json({
      errors: { profile: ['not found'] },
    });
    return;
  }

  let following = false;
  if (req.user) {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetUser.id,
        },
      },
    });
    following = Boolean(follow);
  }

  res.status(200).json({
    profile: {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following,
    },
  });
});

// POST /api/profiles/:username/follow - Follow a user
router.post('/profiles/:username/follow', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const currentUser = req.user!;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    res.status(404).json({
      errors: { profile: ['not found'] },
    });
    return;
  }

  if (currentUser.id !== targetUser.id) {
    await prisma.follows.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
      create: {
        followerId: currentUser.id,
        followingId: targetUser.id,
      },
      update: {},
    });
  }

  res.status(200).json({
    profile: {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true,
    },
  });
});

// DELETE /api/profiles/:username/follow - Unfollow a user
router.delete('/profiles/:username/follow', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const currentUser = req.user!;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    res.status(404).json({
      errors: { profile: ['not found'] },
    });
    return;
  }

  try {
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });
  } catch {
    // If not followed, delete throws P2025; safely ignore
  }

  res.status(200).json({
    profile: {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false,
    },
  });
});

export default router;
