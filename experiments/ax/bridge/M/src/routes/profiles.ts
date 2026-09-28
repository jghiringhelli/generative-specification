import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

// GET /api/profiles/:username - Get profile
router.get(
  '/profiles/:username',
  optionalAuthenticate,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      const user = await prisma.user.findUnique({
        where: { username }
      });

      if (!user) {
        return res.status(404).json({
          errors: { body: ['Profile not found'] }
        });
      }

      let following = false;
      if (req.user) {
        const followRecord = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: req.user.id,
              followingId: user.id
            }
          }
        });
        following = !!followRecord;
      }

      const response: ProfileResponse = {
        profile: {
          username: user.username,
          bio: user.bio,
          image: user.image,
          following
        }
      };

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// POST /api/profiles/:username/follow - Follow user
router.post(
  '/profiles/:username/follow',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      const userToFollow = await prisma.user.findUnique({
        where: { username }
      });

      if (!userToFollow) {
        return res.status(404).json({
          errors: { body: ['Profile not found'] }
        });
      }

      if (userToFollow.id === req.user!.id) {
        return res.status(422).json({
          errors: { body: ['Cannot follow yourself'] }
        });
      }

      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: req.user!.id,
            followingId: userToFollow.id
          }
        },
        update: {},
        create: {
          followerId: req.user!.id,
          followingId: userToFollow.id
        }
      });

      const response: ProfileResponse = {
        profile: {
          username: userToFollow.username,
          bio: userToFollow.bio,
          image: userToFollow.image,
          following: true
        }
      };

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// DELETE /api/profiles/:username/follow - Unfollow user
router.delete(
  '/profiles/:username/follow',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      const userToUnfollow = await prisma.user.findUnique({
        where: { username }
      });

      if (!userToUnfollow) {
        return res.status(404).json({
          errors: { body: ['Profile not found'] }
        });
      }

      await prisma.follow.deleteMany({
        where: {
          followerId: req.user!.id,
          followingId: userToUnfollow.id
        }
      });

      const response: ProfileResponse = {
        profile: {
          username: userToUnfollow.username,
          bio: userToUnfollow.bio,
          image: userToUnfollow.image,
          following: false
        }
      };

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

export default router;
