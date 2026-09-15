import { Response } from 'express';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { hashPassword, comparePassword } from '../lib/password';
import { AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

function toUserResponse(
  user: { id: number; email: string; username: string; bio: string | null; image: string | null },
  token: string
): { user: UserResponse } {
  return {
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body?.user;
  if (!payload) {
    throw new HttpError(422, ["can't be blank"]);
  }
  const { username, email, password } = payload;
  if (!username || !email || !password) {
    const errors: string[] = [];
    if (!username) errors.push('username is required');
    if (!email) errors.push('email is required');
    if (!password) errors.push('password is required');
    throw new HttpError(422, errors);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new HttpError(422, ['email or username already taken']);
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  res.status(201).json(toUserResponse(user, token));
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body?.user;
  if (!payload) {
    throw new HttpError(422, ["can't be blank"]);
  }
  const { email, password } = payload;
  if (!email || !password) {
    throw new HttpError(422, ['email and password are required']);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, ['invalid email or password']);
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new HttpError(401, ['invalid email or password']);
  }

  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  res.json(toUserResponse(user, token));
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    throw new HttpError(404, ['user not found']);
  }
  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  res.json(toUserResponse(user, token));
}

export async function updateCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body?.user;
  if (!payload) {
    throw new HttpError(422, ["can't be blank"]);
  }
  const { email, username, password, bio, image } = payload;

  const data: Record<string, unknown> = {};
  if (email !== undefined) data.email = email;
  if (username !== undefined) data.username = username;
  if (bio !== undefined) data.bio = bio;
  if (image !== undefined) data.image = image;
  if (password) data.password = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
  });

  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  res.json(toUserResponse(user, token));
}
