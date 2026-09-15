import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export async function buildProfile(
  targetUserId: number,
  targetUser: { username: string; bio: string | null; image: string | null },
  currentUserId?: number
): Promise<{ profile: ProfileResponse }> {
  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });
    following = !!follow;
  }
  return {
    profile: {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following,
    },
  };
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const { username } = req.params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new HttpError(404, ['profile not found']);
  }
  res.json(await buildProfile(user.id, user, req.user?.id));
}

export async function followUser(req: AuthRequest, res: Response): Promise<void> {
  const { username } = req.params;
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) {
    throw new HttpError(404, ['profile not found']);
  }
  if (target.id === req.user!.id) {
    throw new HttpError(422, ['cannot follow yourself']);
  }
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: req.user!.id,
        followingId: target.id,
      },
    },
    update: {},
    create: { followerId: req.user!.id, followingId: target.id },
  });
  res.json(await buildProfile(target.id, target, req.user!.id));
}

export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
  const { username } = req.params;
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) {
    throw new HttpError(404, ['profile not found']);
  }
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followingId: target.id },
  });
  res.json(await buildProfile(target.id, target, req.user!.id));
}
