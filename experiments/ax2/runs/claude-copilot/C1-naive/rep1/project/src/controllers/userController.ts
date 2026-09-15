import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

function userResponse(user: {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  id: number;
}) {
  return {
    user: {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: generateToken({ id: user.id, username: user.username }),
    },
  };
}

export async function register(req: AuthRequest, res: Response) {
  const body = req.body.user;
  if (!body || !body.email || !body.username || !body.password) {
    return res.status(422).json({ errors: { body: ['email, username and password are required'] } });
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: body.email }, { username: body.username }] },
  });
  if (existing) {
    return res.status(422).json({ errors: { body: ['email or username already taken'] } });
  }
  const hashed = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      username: body.username,
      password: hashed,
      bio: body.bio ?? null,
      image: body.image ?? null,
    },
  });
  return res.status(201).json(userResponse(user));
}

export async function login(req: AuthRequest, res: Response) {
  const body = req.body.user;
  if (!body || !body.email || !body.password) {
    return res.status(422).json({ errors: { body: ['email and password are required'] } });
  }
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    return res.status(422).json({ errors: { body: ['invalid email or password'] } });
  }
  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) {
    return res.status(422).json({ errors: { body: ['invalid email or password'] } });
  }
  return res.json(userResponse(user));
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(401).json({ errors: { body: ['unauthorized'] } });
  }
  return res.json(userResponse(user));
}

export async function updateUser(req: AuthRequest, res: Response) {
  const body = req.body.user;
  if (!body) {
    return res.status(422).json({ errors: { body: ['user data required'] } });
  }
  const data: Record<string, unknown> = {};
  if (body.email !== undefined) data.email = body.email;
  if (body.username !== undefined) data.username = body.username;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.image !== undefined) data.image = body.image;
  if (body.password !== undefined) data.password = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
  });
  return res.json(userResponse(user));
}
