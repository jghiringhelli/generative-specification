import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { ApiError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const registrationSchema = credentialsSchema.extend({
  username: z.string().min(1),
  password: z.string().min(8),
});
const updateSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  bio: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

function tokenFor(userId: number): string {
  return jwt.sign({ userId }, config.jwtSecret);
}

function userResponse(user: {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}) {
  return {
    user: {
      email: user.email,
      token: tokenFor(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}

router.post("/users", async (request, response, next) => {
  try {
    const input = registrationSchema.parse(request.body?.user);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email: input.email, username: input.username, passwordHash },
    });
    response.status(201).json(userResponse(user));
  } catch (error) {
    next(error);
  }
});

router.post("/users/login", async (request, response, next) => {
  try {
    const input = credentialsSchema.parse(request.body?.user);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new ApiError(422, "email or password is invalid");
    }
    response.json(userResponse(user));
  } catch (error) {
    next(error);
  }
});

router.get("/user", requireAuth, async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user) throw new ApiError(401, "user not found");
    response.json(userResponse(user));
  } catch (error) {
    next(error);
  }
});

router.put("/user", requireAuth, async (request, response, next) => {
  try {
    const input = updateSchema.parse(request.body?.user);
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;
    const user = await prisma.user.update({
      where: { id: request.userId },
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        bio: input.bio,
        image: input.image,
      },
    });
    response.json(userResponse(user));
  } catch (error) {
    next(error);
  }
});

export default router;
