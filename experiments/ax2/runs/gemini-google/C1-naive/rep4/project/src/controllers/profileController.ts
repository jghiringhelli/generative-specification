import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export async function getProfile(req: AuthRequest, res: Response) {
  const { username } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      return res.status(404).json({
        errors: { body: ['Profile not found'] }
      });
    }

    let following = false;
    if (req.user) {
      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: targetUser.id
          }
        }
      });
      following = !!followRecord;
    }

    return res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function followUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { username } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      return res.status(404).json({
        errors: { body: ['Profile not found'] }
      });
    }

    if (req.user.id !== targetUser.id) {
      await prisma.follows.upsert({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: targetUser.id
          }
        },
        create: {
          followerId: req.user.id,
          followingId: targetUser.id
        },
        update: {}
      });
    }

    return res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: true
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function unfollowUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { username } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      return res.status(404).json({
        errors: { body: ['Profile not found'] }
      });
    }

    await prisma.follows.deleteMany({
      where: {
        followerId: req.user.id,
        followingId: targetUser.id
      }
    });

    return res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: false
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}
