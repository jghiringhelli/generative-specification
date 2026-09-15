import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';
import { buildProfile } from '../utils/helpers';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  });
  if (!user) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  const profile = await buildProfile(user.id, req.user?.id);
  return res.json({ profile });
}

export async function followUser(req: AuthRequest, res: Response) {
  const target = await prisma.user.findUnique({
    where: { username: req.params.username },
  });
  if (!target) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: req.user!.id,
        followingId: target.id,
      },
    },
    update: {},
    create: {
      followerId: req.user!.id,
      followingId: target.id,
    },
  });
  const profile = await buildProfile(target.id, req.user!.id);
  return res.json({ profile });
}

export async function unfollowUser(req: AuthRequest, res: Response) {
  const target = await prisma.user.findUnique({
    where: { username: req.params.username },
  });
  if (!target) {
    return res.status(404).json({ errors: { body: ['profile not found'] } });
  }
  await prisma.follow.deleteMany({
    where: {
      followerId: req.user!.id,
      followingId: target.id,
    },
  });
  const profile = await buildProfile(target.id, req.user!.id);
  return res.json({ profile });
}
