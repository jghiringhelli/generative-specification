import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export async function getProfile(username: string, currentUserId?: number) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      followers: currentUserId ? {
        where: { followerId: currentUserId }
      } : false
    }
  });

  if (!user) {
    throw new NotFoundError('Profile not found');
  }

  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following: currentUserId ? (user.followers as any[]).length > 0 : false
  };
}

export async function followUser(username: string, currentUserId: number) {
  const userToFollow = await prisma.user.findUnique({
    where: { username }
  });

  if (!userToFollow) {
    throw new NotFoundError('Profile not found');
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userToFollow.id
      }
    },
    create: {
      followerId: currentUserId,
      followingId: userToFollow.id
    },
    update: {}
  });

  return {
    username: userToFollow.username,
    bio: userToFollow.bio,
    image: userToFollow.image,
    following: true
  };
}

export async function unfollowUser(username: string, currentUserId: number) {
  const userToUnfollow = await prisma.user.findUnique({
    where: { username }
  });

  if (!userToUnfollow) {
    throw new NotFoundError('Profile not found');
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: currentUserId,
      followingId: userToUnfollow.id
    }
  });

  return {
    username: userToUnfollow.username,
    bio: userToUnfollow.bio,
    image: userToUnfollow.image,
    following: false
  };
}
