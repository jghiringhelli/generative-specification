import { Router } from "express";

import { ApiError } from "../errors";
import {
  optionalAuthentication,
  requireAuthentication,
} from "../middleware/authentication";
import { prisma } from "../prisma";
import { toProfileResponse } from "./profile.dto";

const router = Router();

router.get(
  "/profiles/:username",
  optionalAuthentication,
  async (request, response, next) => {
    try {
      const profile = await findProfile(request.params.username);
      response.json({ profile: toProfileResponse(profile, request.userId) });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/profiles/:username/follow",
  requireAuthentication,
  async (request, response, next) => {
    try {
      const target = await findProfile(request.params.username);
      if (target.id === request.userId) {
        throw new ApiError(422, { body: ["cannot follow yourself"] });
      }
      const profile = await prisma.user.update({
        where: { id: target.id },
        data: { followers: { connect: { id: request.userId } } },
        include: { followers: { select: { id: true } } },
      });
      response.json({ profile: toProfileResponse(profile, request.userId) });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/profiles/:username/follow",
  requireAuthentication,
  async (request, response, next) => {
    try {
      const target = await findProfile(request.params.username);
      const profile = await prisma.user.update({
        where: { id: target.id },
        data: { followers: { disconnect: { id: request.userId } } },
        include: { followers: { select: { id: true } } },
      });
      response.json({ profile: toProfileResponse(profile, request.userId) });
    } catch (error) {
      next(error);
    }
  },
);

async function findProfile(username: string) {
  const profile = await prisma.user.findUnique({
    where: { username },
    include: { followers: { select: { id: true } } },
  });
  if (!profile) throw new ApiError(404, { profile: ["not found"] });
  return profile;
}

export { router as profileRouter };
