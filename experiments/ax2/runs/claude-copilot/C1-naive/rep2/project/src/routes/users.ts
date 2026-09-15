import { Router, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

const router = Router();

interface UserRecord {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}

function toUserResponse(user: UserRecord) {
  return {
    user: {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      }),
    },
  };
}

// POST /api/users — register
router.post('/users', async (req, res, next) => {
  try {
    const body = req.body?.user;
    if (!body) throw new HttpError(422, "can't be blank");
    const { username, email, password } = body;
    const errors: string[] = [];
    if (!username) errors.push("username can't be blank");
    if (!email) errors.push("email can't be blank");
    if (!password) errors.push("password can't be blank");
    if (errors.length) throw new HttpError(422, errors);

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new HttpError(422, 'email has already been taken');
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername)
      throw new HttpError(422, 'username has already been taken');

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: await hashPassword(password),
      },
    });
    res.status(201).json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login — log in
router.post('/users/login', async (req, res, next) => {
  try {
    const body = req.body?.user;
    if (!body) throw new HttpError(422, "can't be blank");
    const { email, password } = body;
    const errors: string[] = [];
    if (!email) errors.push("email can't be blank");
    if (!password) errors.push("password can't be blank");
    if (errors.length) throw new HttpError(422, errors);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, 'email or password is invalid');
    const valid = await comparePassword(password, user.password);
    if (!valid) throw new HttpError(401, 'email or password is invalid');

    res.json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
});

// GET /api/user — current user
router.get('/user', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
});

// PUT /api/user — update current user
router.put('/user', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body?.user || {};
    const data: Record<string, unknown> = {};
    if (body.email !== undefined) data.email = body.email;
    if (body.username !== undefined) data.username = body.username;
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.image !== undefined) data.image = body.image;
    if (body.password) data.password = await hashPassword(body.password);

    if (body.email) {
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existing && existing.id !== req.user!.id)
        throw new HttpError(422, 'email has already been taken');
    }
    if (body.username) {
      const existing = await prisma.user.findUnique({
        where: { username: body.username },
      });
      if (existing && existing.id !== req.user!.id)
        throw new HttpError(422, 'username has already been taken');
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });
    res.json(toUserResponse(user));
  } catch (err) {
    next(err);
  }
});

export default router;
