import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { ApiError } from "../errors";
import { requireAuthentication } from "../middleware/authentication";
import { prisma } from "../prisma";
import { toUserResponse } from "./user.dto";

const router = Router();
const credentialsSchema = z.object({
  user: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
});
const registrationSchema = z.object({
  user: z.object({
    username: z.string().min(1),
    email: z.email(),
    password: z.string().min(1),
  }),
});
const updateSchema = z.object({
  user: z.object({
    username: z.string().min(1).optional(),
    email: z.email().optional(),
    password: z.string().min(1).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }),
});

router.post("/users", async (request, response, next) => {
  try {
    const { user } = registrationSchema.parse(request.body);
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { username: user.username }] },
    });
    if (exists) throw new ApiError(422, { body: ["email or username is already taken"] });
    const created = await prisma.user.create({
      data: {
        email: user.email,
        username: user.username,
        passwordHash: await bcrypt.hash(user.password, 10),
      },
    });
    response.status(201).json({ user: toUserResponse(created) });
  } catch (error) {
    next(error);
  }
});

router.post("/users/login", async (request, response, next) => {
  try {
    const { user } = credentialsSchema.parse(request.body);
    const found = await prisma.user.findUnique({ where: { email: user.email } });
    if (!found || !(await bcrypt.compare(user.password, found.passwordHash))) {
      throw new ApiError(422, { body: ["email or password is invalid"] });
    }
    response.json({ user: toUserResponse(found) });
  } catch (error) {
    next(error);
  }
});

router.get("/user", requireAuthentication, async (request, response, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId } });
    response.json({ user: toUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

router.put("/user", requireAuthentication, async (request, response, next) => {
  try {
    const { user } = updateSchema.parse(request.body);
    const updated = await prisma.user.update({
      where: { id: request.userId },
      data: {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        passwordHash: user.password ? await bcrypt.hash(user.password, 10) : undefined,
      },
    });
    response.json({ user: toUserResponse(updated) });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
