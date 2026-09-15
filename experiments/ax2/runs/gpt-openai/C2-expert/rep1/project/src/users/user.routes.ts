import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, registerSchema, updateUserSchema } from "./user.schemas";
import { UserService } from "./user.service";

/** Creates the authentication and current-user routes. */
export function createUserRouter(service: UserService, jwtSecret: string): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);

  router.post("/users", validateBody(registerSchema), async (request, response, next) => {
    try {
      response.status(201).json({ user: await service.register(request.body.user) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/login", validateBody(loginSchema), async (request, response, next) => {
    try {
      const { email, password } = request.body.user;
      response.json({ user: await service.login(email, password) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/user", auth, async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ user: await service.getCurrent(request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    "/user",
    auth,
    validateBody(updateUserSchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({ user: await service.update(request.userId!, request.body.user) });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
