import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { toUserResponse } from '../utils/view';
import { unprocessable, unauthorized, notFound } from '../utils/errors';

const router = Router();

// POST /api/users — register
router.post('/users', async (req: Request, res: Response) => {
  const user = req.body?.user || {};
  const { username, email, password } = user;

  const errors: Record<string, string[]> = {};
  if (!username) errors.username = ["can't be blank"];
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length > 0) throw unprocessable(errors);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    const dup: Record<string, string[]> = {};
    if (existing.email === email) dup.email = ['has already been taken'];
    if (existing.username === username) dup.username = ['has already been taken'];
    throw unprocessable(dup);
  }

  const hashed = await hashPassword(password);
  const created = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  res.status(201).json(toUserResponse(created));
});

// POST /api/users/login — log in
router.post('/users/login', async (req: Request, res: Response) => {
  const user = req.body?.user || {};
  const { email, password } = user;

  const errors: Record<string, string[]> = {};
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length > 0) throw unprocessable(errors);

  const found = await prisma.user.findUnique({ where: { email } });
  if (!found) throw unauthorized('email or password is invalid');

  const valid = await comparePassword(password, found.password);
  if (!valid) throw unauthorized('email or password is invalid');

  const token = generateToken({ id: found.id, username: found.username });
  res.json(toUserResponse(found, token));
});

// GET /api/user — get current user
router.get('/user', requireAuth, async (req: Request, res: Response) => {
  const found = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!found) throw notFound('User not found');

  const token = generateToken({ id: found.id, username: found.username });
  res.json(toUserResponse(found, token));
});

// PUT /api/user — update current user
router.put('/user', requireAuth, async (req: Request, res: Response) => {
  const updates = req.body?.user || {};
  const data: Record<string, string> = {};

  if (updates.email !== undefined) data.email = updates.email;
  if (updates.username !== undefined) data.username = updates.username;
  if (updates.bio !== undefined) data.bio = updates.bio;
  if (updates.image !== undefined) data.image = updates.image;
  if (updates.password !== undefined && updates.password !== '') {
    data.password = await hashPassword(updates.password);
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data,
  });

  const token = generateToken({ id: updated.id, username: updated.username });
  res.json(toUserResponse(updated, token));
});

export default router;
