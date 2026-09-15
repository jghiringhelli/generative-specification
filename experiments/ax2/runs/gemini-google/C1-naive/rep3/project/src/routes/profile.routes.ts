import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profiles/:username - Get a profile
router.get('/profiles/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ errors: { profile: ['not found'] } });
    }

    let following = false;
    if (req.userId) {
      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.userId,
            followingId: user.id
          }
        }
      });
      following = !!followRecord;
    }

    return res.status(200).json({
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// POST /api/profiles/:username/follow - Follow a user
router.post('/profiles/:username/follow', requireAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      return res.status(404).json({ errors: { profile: ['not found'] } });
    }

    if (req.userId === targetUser.id) {
      return res.status(422).json({ errors: { profile: ['cannot follow yourself'] } });
    }

    await prisma.follows.upsert({
      where: {
        followerId_followingId: {
          followerId: req.userId!,
          followingId: targetUser.id
        }
      },
      create: {
        followerId: req.userId!,
        followingId: targetUser.id
      },
      update: {}
    });

    return res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: true
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// DELETE /api/profiles/:username/follow - Unfollow a user
router.delete('/profiles/:username/follow', requireAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      return res.status(404).json({ errors: { profile: ['not found'] } });
    }

    try {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: req.userId!,
            followingId: targetUser.id
          }
        }
      });
    } catch (e) {
      // If already not following, ignore
    }

    return res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: false
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

export default router;
