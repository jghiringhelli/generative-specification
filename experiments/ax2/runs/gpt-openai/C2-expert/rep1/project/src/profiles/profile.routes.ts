import { Router } from "express";
import {
  AuthenticatedRequest,
  optionalAuth,
  requireAuth
} from "../middleware/auth.middleware";
import { ProfileService } from "./profile.service";

/** Creates profile retrieval and follow-management routes. */
export function createProfileRouter(service: ProfileService, jwtSecret: string): Router {
  const router = Router();
  const required = requireAuth(jwtSecret);

  router.get(
    "/profiles/:username",
    optionalAuth(jwtSecret),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          profile: await service.get(request.params.username, request.userId)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/profiles/:username/follow",
    required,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          profile: await service.follow(request.params.username, request.userId!)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/profiles/:username/follow",
    required,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          profile: await service.unfollow(request.params.username, request.userId!)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
