import { Router } from "express";
import { optionalAuthentication, requireAuthentication } from "../auth/middleware";
import { followProfile, getProfile, unfollowProfile } from "./service";

export const profileRouter = Router();

profileRouter.get("/profiles/:username", optionalAuthentication, async (request, response, next) => {
  try {
    response.json({ profile: await getProfile(request.params.username, request.userId) });
  } catch (error) {
    next(error);
  }
});

profileRouter.post(
  "/profiles/:username/follow",
  requireAuthentication,
  async (request, response, next) => {
    try {
      response.json({ profile: await followProfile(request.params.username, request.userId!) });
    } catch (error) {
      next(error);
    }
  },
);

profileRouter.delete(
  "/profiles/:username/follow",
  requireAuthentication,
  async (request, response, next) => {
    try {
      response.json({ profile: await unfollowProfile(request.params.username, request.userId!) });
    } catch (error) {
      next(error);
    }
  },
);
