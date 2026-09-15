import { Router } from "express";
import { requireAuthentication } from "../auth/middleware";
import { getCurrentUser, loginUser, registerUser, updateCurrentUser } from "./service";

export const userRouter = Router();

userRouter.post("/users", async (request, response, next) => {
  try {
    response.status(201).json({ user: await registerUser(request.body.user ?? {}) });
  } catch (error) {
    next(error);
  }
});

userRouter.post("/users/login", async (request, response, next) => {
  try {
    response.json({ user: await loginUser(request.body.user ?? {}) });
  } catch (error) {
    next(error);
  }
});

userRouter.get("/user", requireAuthentication, async (request, response, next) => {
  try {
    response.json({ user: await getCurrentUser(request.userId!) });
  } catch (error) {
    next(error);
  }
});

userRouter.put("/user", requireAuthentication, async (request, response, next) => {
  try {
    response.json({ user: await updateCurrentUser(request.userId!, request.body.user ?? {}) });
  } catch (error) {
    next(error);
  }
});
