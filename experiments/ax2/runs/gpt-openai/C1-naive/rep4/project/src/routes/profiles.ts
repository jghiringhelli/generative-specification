import { Router } from "express";
import { ApiError } from "../errors";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();

async function findProfile(username: string, viewerId?: number) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      followers: viewerId
        ? { where: { followerId: viewerId }, select: { followerId: true } }
        : false,
    },
  });

  if (!user) throw new ApiError(404, "profile not found");
  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: Boolean(user.followers?.length),
    },
  };
}

router.get("/profiles/:username", optionalAuth, async (request, response, next) => {
  try {
    response.json(await findProfile(request.params.username, request.userId));
  } catch (error) {
    next(error);
  }
});

router.post("/profiles/:username/follow", requireAuth, async (request, response, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: request.params.username } });
    if (!target) throw new ApiError(404, "profile not found");
    if (target.id === request.userId) throw new ApiError(422, "cannot follow yourself");

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: request.userId!,
          followingId: target.id,
        },
      },
      create: { followerId: request.userId!, followingId: target.id },
      update: {},
    });
    response.json(await findProfile(target.username, request.userId));
  } catch (error) {
    next(error);
  }
});

router.delete("/profiles/:username/follow", requireAuth, async (request, response, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: request.params.username } });
    if (!target) throw new ApiError(404, "profile not found");

    await prisma.follow.deleteMany({
      where: { followerId: request.userId, followingId: target.id },
    });
    response.json(await findProfile(target.username, request.userId));
  } catch (error) {
    next(error);
  }
});

export default router;
