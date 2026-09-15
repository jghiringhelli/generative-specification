import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { createToken } from '../utils/jwt';
import { formatUser } from '../utils/responses';

export const usersRouter = Router();

usersRouter.post('/users', async (request, response, next) => {
  try {
    const { email, username, password } = request.body.user ?? {};
    if (!email || !username || !password) {
      response.status(422).json({ errors: { body: ['email, username and password are required'] } });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, username, passwordHash } });
    response.status(201).json({ user: formatUser(user, createToken(user.id)) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(422).json({ errors: { body: ['email or username has already been taken'] } });
      return;
    }
    next(error);
  }
});

usersRouter.post('/users/login', async (request, response) => {
  const { email, password } = request.body.user ?? {};
  if (!email || !password) {
    response.status(422).json({ errors: { body: ['email and password are required'] } });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    return;
  }
  response.json({ user: formatUser(user, createToken(user.id)) });
});

usersRouter.get('/user', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId } });
  response.json({ user: formatUser(user) });
});

usersRouter.put('/user', requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const changes = request.body.user ?? {};
    const data: Prisma.UserUpdateInput = {};
    if (changes.email !== undefined) data.email = changes.email;
    if (changes.username !== undefined) data.username = changes.username;
    if (changes.bio !== undefined) data.bio = changes.bio;
    if (changes.image !== undefined) data.image = changes.image;
    if (changes.password !== undefined) data.passwordHash = await bcrypt.hash(changes.password, 10);

    const user = await prisma.user.update({ where: { id: request.userId }, data });
    response.json({ user: formatUser(user) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(422).json({ errors: { body: ['email or username has already been taken'] } });
      return;
    }
    next(error);
  }
});
