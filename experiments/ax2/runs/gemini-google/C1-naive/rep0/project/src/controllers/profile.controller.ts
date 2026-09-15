import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, ProfileResponse } from '../types';

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { username } = req.params;

  const targetUser = await prisma.user.findUnique({
    where: { username }
  });

  if (!targetUser) {
    res.status(404).json({ errors: { profile: ['not found'] } });
    return;
  }

  let following = false;
  if (req.user) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetUser.id
        }
      }
    });
    following = Boolean(followRecord);
  }

  const profile: ProfileResponse = {
    username: targetUser.username,
    bio: targetUser.bio || '',
    image: targetUser.image || '',
    following
  };

  res.status(200).json({ profile });
};

export const followUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { username } = req.params;

  const targetUser = await prisma.user.findUnique({
    where: { username }
  });

  if (!targetUser) {
    res.status(404).json({ errors: { profile: ['not found'] } });
    return;
  }

  if (targetUser.id !== req.user.id) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetUser.id
        }
      },
      update: {},
      create: {
        followerId: req.user.id,
        followingId: targetUser.id
      }
    });
  }

  const profile: ProfileResponse = {
    username: targetUser.username,
    bio: targetUser.bio || '',
    image: targetUser.image || '',
    following: true
  };

  res.status(200).json({ profile });
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { username } = req.params;

  const targetUser = await prisma.user.findUnique({
    where: { username }
  });

  if (!targetUser) {
    res.status(404).json({ errors: { profile: ['not found'] } });
    return;
  }

  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetUser.id
        }
      }
    });
  } catch (err) {
    // Already unfollowed / record does not exist
  }

  const profile: ProfileResponse = {
    username: targetUser.username,
    bio: targetUser.bio || '',
    image: targetUser.image || '',
    following: false
  };

  res.status(200).json({ profile });
};
