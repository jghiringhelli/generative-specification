import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      res.status(404).json({ errors: { profile: ['User not found'] } });
      return;
    }

    let following = false;
    if (req.user) {
      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: user.id
          }
        }
      });
      following = !!followRecord;
    }

    res.status(200).json({
      profile: {
        username: user.username,
        bio: user.bio || '',
        image: user.image || '',
        following
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function followUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { username } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      res.status(404).json({ errors: { profile: ['User not found'] } });
      return;
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

    res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio || '',
        image: targetUser.image || '',
        following: true
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { username } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!targetUser) {
      res.status(404).json({ errors: { profile: ['User not found'] } });
      return;
    }

    await prisma.follows.deleteMany({
      where: {
        followerId: req.user.id,
        followingId: targetUser.id
      }
    });

    res.status(200).json({
      profile: {
        username: targetUser.username,
        bio: targetUser.bio || '',
        image: targetUser.image || '',
        following: false
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}
