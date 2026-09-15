import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { UserRepository } from "../user/user.repository";
import { ProfileService } from "./profile.service";

/**
 * Build the profile router.
 * @param service Injected profile service.
 * @returns An Express router for profile endpoints.
 */
export function createProfileRouter(service: ProfileService): Router {
  const router = Router();

  router.get(
    "/profiles/:username",
    optionalAuth,
    asyncHandler(async (req, res) => {
      const profile = await service.getProfile(
        req.params.username,
        req.user?.id,
      );
      res.status(200).json(profile);
    }),
  );

  router.post(
    "/profiles/:username/follow",
    requireAuth,
    asyncHandler(async (req, res) => {
      const profile = await service.follow(req.params.username, req.user!.id);
      res.status(200).json(profile);
    }),
  );

  router.delete(
    "/profiles/:username/follow",
    requireAuth,
    asyncHandler(async (req, res) => {
      const profile = await service.unfollow(req.params.username, req.user!.id);
      res.status(200).json(profile);
    }),
  );

  return router;
}

/** Default composition helper wiring the repository into the service. */
export function buildProfileModule(): ProfileService {
  return new ProfileService(new UserRepository());
}
