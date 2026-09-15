import prisma from '../prisma';

export interface ProfileView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

interface UserLike {
  username: string;
  bio: string | null;
  image: string | null;
}

export async function isFollowing(
  followerId: number | undefined,
  followingId: number
): Promise<boolean> {
  if (!followerId) return false;
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });
  return !!follow;
}

export function toProfile(user: UserLike, following: boolean): ProfileView {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following,
  };
}
