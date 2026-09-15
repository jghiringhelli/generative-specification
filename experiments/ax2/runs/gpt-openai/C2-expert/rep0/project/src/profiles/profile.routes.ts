import { Router } from "express";
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from "../middleware/auth";
import { ProfileService } from "./profile.service";

/** Creates profile and follow routes. */
export function createProfileRouter(service: ProfileService, jwtSecret: string): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(jwtSecret);
  const optionalAuthenticate = createOptionalAuthMiddleware(jwtSecret);

  router.get("/profiles/:username", optionalAuthenticate, async (request, response, next) => {
    try {
      const userId = (request as Partial<AuthenticatedRequest>).userId;
      response.json({ profile: await service.get(request.params.username, userId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/profiles/:username/follow", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json({ profile: await service.follow(request.params.username, userId) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/profiles/:username/follow", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json({ profile: await service.unfollow(request.params.username, userId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
