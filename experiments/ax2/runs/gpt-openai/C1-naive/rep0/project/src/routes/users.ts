import bcrypt from "bcryptjs";
import { Router } from "express";
import { authenticate } from "../auth";
import { prisma } from "../prisma";
import { serializeUser } from "../serializers";

export const usersRouter = Router();

usersRouter.post("/users", async (req, res, next) => {
  try {
    const { email, username, password } = req.body.user ?? {};
    if (!email || !username || !password) {
      res.status(422).json({ errors: { body: ["email, username and password are required"] } });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      res.status(422).json({ errors: { body: ["email or username is already taken"] } });
      return;
    }

    const user = await prisma.user.create({
      data: { email, username, passwordHash: await bcrypt.hash(password, 10) },
    });
    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/users/login", async (req, res, next) => {
  try {
    const { email, password } = req.body.user ?? {};
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(422).json({ errors: { "email or password": ["is invalid"] } });
      return;
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/user", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/user", authenticate, async (req, res, next) => {
  try {
    const input = req.body.user ?? {};
    const data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string | null;
      image?: string | null;
    } = {};

    if (input.email !== undefined) data.email = input.email;
    if (input.username !== undefined) data.username = input.username;
    if (input.password !== undefined) data.passwordHash = await bcrypt.hash(input.password, 10);
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.image !== undefined) data.image = input.image;

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});
