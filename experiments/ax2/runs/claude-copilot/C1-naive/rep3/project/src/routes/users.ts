import { Router, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { toUserResponse } from '../utils/serializers';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/users — register
router.post('/users', async (req, res: Response) => {
  const body = req.body?.user || {};
  const { username, email, password } = body;

  const errors: Record<string, string[]> = {};
  if (!username) errors.username = ["can't be blank"];
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(422).json({
      errors: { 'email or username': ['has already been taken'] },
    });
  }

  const user = await prisma.user.create({
    data: { username, email, password: await hashPassword(password) },
  });

  return res.status(201).json(toUserResponse(user));
});

// POST /api/users/login — log in
router.post('/users/login', async (req, res: Response) => {
  const body = req.body?.user || {};
  const { email, password } = body;

  const errors: Record<string, string[]> = {};
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
  }

  return res.json(toUserResponse(user));
});

// GET /api/user — get current user
router.get('/user', auth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(401).json({ errors: { body: ['unauthorized'] } });
  }
  return res.json(toUserResponse(user));
});

// PUT /api/user — update current user
router.put('/user', auth, async (req: AuthRequest, res: Response) => {
  const body = req.body?.user || {};
  const { email, username, password, bio, image } = body;

  const data: Record<string, unknown> = {};
  if (email !== undefined) data.email = email;
  if (username !== undefined) data.username = username;
  if (bio !== undefined) data.bio = bio;
  if (image !== undefined) data.image = image;
  if (password) data.password = await hashPassword(password);

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });
    return res.json(toUserResponse(user));
  } catch (e) {
    return res.status(422).json({
      errors: { 'email or username': ['has already been taken'] },
    });
  }
});

export default router;
