import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
} from "./user.schemas";

/**
 * Build the user/authentication router.
 * @param service Injected user service.
 * @returns An Express router mounted at the application root.
 */
export function createUserRouter(service: UserService): Router {
  const router = Router();

  router.post(
    "/users",
    asyncHandler(async (req, res) => {
      const { user } = validate(registerSchema, req.body);
      res.status(201).json(await service.register(user));
    }),
  );

  router.post(
    "/users/login",
    asyncHandler(async (req, res) => {
      const { user } = validate(loginSchema, req.body);
      res.status(200).json(await service.login(user));
    }),
  );

  router.get(
    "/user",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.status(200).json(await service.getCurrent(req.user!.id));
    }),
  );

  router.put(
    "/user",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { user } = validate(updateUserSchema, req.body);
      res.status(200).json(await service.update(req.user!.id, user));
    }),
  );

  return router;
}

/** Default composition helper wiring the repository into the service. */
export function buildUserModule(): UserService {
  return new UserService(new UserRepository());
}
