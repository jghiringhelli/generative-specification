import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { generateToken } from '../utils/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/users - Register
router.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  const { user } = req.body || {};

  if (!user) {
    res.status(422).json({
      errors: { body: ["user object is required"] },
    });
    return;
  }

  const { username, email, password } = user;
  const errors: Record<string, string[]> = {};

  if (!username) errors.username = ["can't be blank"];
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    res.status(422).json({
      errors: { email: ['has already been taken'] },
    });
    return;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    res.status(422).json({
      errors: { username: ['has already been taken'] },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  const token = generateToken(newUser);

  res.status(201).json({
    user: {
      email: newUser.email,
      token,
      username: newUser.username,
      bio: newUser.bio,
      image: newUser.image,
    },
  });
});

// POST /api/users/login - Log in
router.post('/users/login', async (req: AuthRequest, res: Response): Promise<void> => {
  const { user } = req.body || {};

  if (!user) {
    res.status(422).json({
      errors: { body: ['user object is required'] },
    });
    return;
  }

  const { email, password } = user;
  const errors: Record<string, string[]> = {};

  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    res.status(422).json({
      errors: { 'email or password': ['is invalid'] },
    });
    return;
  }

  const validPassword = await bcrypt.compare(password, existingUser.password);
  if (!validPassword) {
    res.status(422).json({
      errors: { 'email or password': ['is invalid'] },
    });
    return;
  }

  const token = generateToken(existingUser);

  res.status(200).json({
    user: {
      email: existingUser.email,
      token,
      username: existingUser.username,
      bio: existingUser.bio,
      image: existingUser.image,
    },
  });
});

// GET /api/user - Get current user
router.get('/user', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user) {
    res.status(404).json({
      errors: { user: ['not found'] },
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : generateToken(user);

  res.status(200).json({
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
});

// PUT /api/user - Update current user
router.put('/user', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { user } = req.body || {};

  if (!user) {
    res.status(422).json({
      errors: { body: ['user object is required'] },
    });
    return;
  }

  const updateData: {
    email?: string;
    username?: string;
    password?: string;
    bio?: string | null;
    image?: string | null;
  } = {};

  if (user.email !== undefined) {
    if (user.email !== currentUser.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: user.email } });
      if (existingEmail) {
        res.status(422).json({
          errors: { email: ['has already been taken'] },
        });
        return;
      }
    }
    updateData.email = user.email;
  }

  if (user.username !== undefined) {
    if (user.username !== currentUser.username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: user.username } });
      if (existingUsername) {
        res.status(422).json({
          errors: { username: ['has already been taken'] },
        });
        return;
      }
    }
    updateData.username = user.username;
  }

  if (user.password !== undefined && user.password !== '') {
    updateData.password = await bcrypt.hash(user.password, 10);
  }

  if (user.bio !== undefined) {
    updateData.bio = user.bio;
  }

  if (user.image !== undefined) {
    updateData.image = user.image;
  }

  const updatedUser = await prisma.user.update({
    where: { id: currentUser.id },
    data: updateData,
  });

  const token = generateToken(updatedUser);

  res.status(200).json({
    user: {
      email: updatedUser.email,
      token,
      username: updatedUser.username,
      bio: updatedUser.bio,
      image: updatedUser.image,
    },
  });
});

export default router;
