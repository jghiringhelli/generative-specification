import { Response } from 'express';
import prisma from '../prisma';

interface AuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export async function buildProfile(
  targetUserId: number,
  currentUserId?: number
): Promise<AuthorView> {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new Error('User not found');
  }
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
    username: user.username,
    bio: user.bio,
    image: user.image,
    following,
  };
}

export function handleError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'unknown error';
  return res.status(422).json({ errors: { body: [message] } });
}
