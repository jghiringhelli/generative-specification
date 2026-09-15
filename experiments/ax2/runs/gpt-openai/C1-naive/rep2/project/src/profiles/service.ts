import { prisma } from "../database";
import { NotFoundError, ValidationError } from "../errors";

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

async function findUser(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new NotFoundError("Profile not found");
  return user;
}

async function buildProfile(username: string, viewerId?: number): Promise<ProfileResponse> {
  const user = await findUser(username);
  const following = viewerId
    ? Boolean(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      }))
    : false;
  return { username: user.username, bio: user.bio, image: user.image, following };
}

/** Returns a public user profile. */
export async function getProfile(username: string, viewerId?: number): Promise<ProfileResponse> {
  return buildProfile(username, viewerId);
}

/** Follows the specified profile. */
export async function followProfile(username: string, followerId: number): Promise<ProfileResponse> {
  const target = await findUser(username);
  if (target.id === followerId) {
    throw new ValidationError({ body: ["cannot follow yourself"] });
  }
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId: target.id } },
    create: { followerId, followingId: target.id },
    update: {},
  });
  return buildProfile(username, followerId);
}

/** Unfollows the specified profile. */
export async function unfollowProfile(username: string, followerId: number): Promise<ProfileResponse> {
  const target = await findUser(username);
  await prisma.follow.deleteMany({ where: { followerId, followingId: target.id } });
  return buildProfile(username, followerId);
}
