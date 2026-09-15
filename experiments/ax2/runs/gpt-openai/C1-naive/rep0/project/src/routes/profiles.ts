import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../auth";
import { prisma } from "../prisma";
import { serializeProfile } from "../serializers";

export const profilesRouter = Router();

profilesRouter.get("/profiles/:username", optionalAuthenticate, async (req, res, next) => {
  try {
    const profile = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!profile) {
      res.status(404).json({ errors: { body: ["Profile not found"] } });
      return;
    }

    const follow = req.userId
      ? await prisma.follow.findUnique({
          where: {
            followerId_followingId: { followerId: req.userId, followingId: profile.id },
          },
        })
      : null;
    res.json({ profile: serializeProfile(profile, Boolean(follow)) });
  } catch (error) {
    next(error);
  }
});

profilesRouter.post("/profiles/:username/follow", authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!profile) {
      res.status(404).json({ errors: { body: ["Profile not found"] } });
      return;
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: req.userId!, followingId: profile.id },
      },
      create: { followerId: req.userId!, followingId: profile.id },
      update: {},
    });
    res.json({ profile: serializeProfile(profile, true) });
  } catch (error) {
    next(error);
  }
});

profilesRouter.delete("/profiles/:username/follow", authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!profile) {
      res.status(404).json({ errors: { body: ["Profile not found"] } });
      return;
    }

    await prisma.follow.deleteMany({
      where: { followerId: req.userId, followingId: profile.id },
    });
    res.json({ profile: serializeProfile(profile, false) });
  } catch (error) {
    next(error);
  }
});
