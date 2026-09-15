import { Router } from "express";
import { createAuthMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { UserService } from "./user.service";
import { loginSchema, registerSchema, updateUserSchema } from "./user.schemas";

/** Creates authentication and current-user routes. */
export function createUserRouter(service: UserService, jwtSecret: string): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(jwtSecret);

  router.post("/users", async (request, response, next) => {
    try {
      response.status(201).json({ user: await service.register(registerSchema.parse(request.body).user) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/login", async (request, response, next) => {
    try {
      response.json({ user: await service.login(loginSchema.parse(request.body).user) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/user", authenticate, async (request, response, next) => {
    try {
      response.json({ user: await service.getCurrent((request as AuthenticatedRequest).userId) });
    } catch (error) {
      next(error);
    }
  });

  router.put("/user", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json({ user: await service.update(userId, updateUserSchema.parse(request.body).user) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
