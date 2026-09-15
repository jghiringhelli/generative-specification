import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { UserService } from "./user.service";
import { loginSchema, registerSchema, updateUserSchema } from "./user.schemas";

export function createUserRouter(service: UserService, jwtSecret: string): Router {
  const router = Router();

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

  router.get("/user", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ user: await service.getById(request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  router.put("/user", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = updateUserSchema.parse(request.body).user;
      response.json({ user: await service.update(request.userId!, input) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
