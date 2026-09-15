import { Router } from "express";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { ProfileService } from "./profile.service";

export function createProfileRouter(service: ProfileService, jwtSecret: string): Router {
  const router = Router();

  router.get("/:username", optionalAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ profile: await service.get(request.params.username, request.userId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:username/follow", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ profile: await service.follow(request.params.username, request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:username/follow", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ profile: await service.unfollow(request.params.username, request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
