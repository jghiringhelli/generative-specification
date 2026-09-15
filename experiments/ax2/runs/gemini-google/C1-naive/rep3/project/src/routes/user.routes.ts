import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { requireAuth, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/users - Register
router.post('/users', async (req: AuthRequest, res: Response) => {
  const { user } = req.body || {};

  if (!user || !user.username || !user.email || !user.password) {
    return res.status(422).json({
      errors: {
        body: ['username, email, and password are required']
      }
    });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: user.email },
          { username: user.username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === user.email) {
        return res.status(422).json({ errors: { email: ['has already been taken'] } });
      }
      if (existingUser.username === user.username) {
        return res.status(422).json({ errors: { username: ['has already been taken'] } });
      }
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        bio: user.bio || '',
        image: user.image || null
      }
    });

    const token = generateToken(newUser.id);

    return res.status(201).json({
      user: {
        email: newUser.email,
        token,
        username: newUser.username,
        bio: newUser.bio,
        image: newUser.image
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// POST /api/users/login - Log in
router.post('/users/login', async (req: AuthRequest, res: Response) => {
  const { user } = req.body || {};

  if (!user || !user.email || !user.password) {
    return res.status(422).json({
      errors: {
        body: ['email and password are required']
      }
    });
  }

  try {
    const foundUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!foundUser) {
      return res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    }

    const isMatch = await bcrypt.compare(user.password, foundUser.password);
    if (!isMatch) {
      return res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    }

    const token = generateToken(foundUser.id);

    return res.status(200).json({
      user: {
        email: foundUser.email,
        token,
        username: foundUser.username,
        bio: foundUser.bio,
        image: foundUser.image
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// GET /api/user - Get current user
router.get('/user', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ errors: { user: ['not found'] } });
    }

    // In RealWorld spec, GET /api/user returns the user with the token passed in Authorization header or a generated token
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2) {
        token = parts[1];
      }
    }
    if (!token) {
      token = generateToken(user.id);
    }

    return res.status(200).json({
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// PUT /api/user - Update current user
router.put('/user', requireAuth, async (req: AuthRequest, res: Response) => {
  const { user: updateData } = req.body || {};

  if (!updateData) {
    return res.status(422).json({ errors: { body: ['user data is required'] } });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ errors: { user: ['not found'] } });
    }

    // Check unique constraints if email or username is changing
    if (updateData.email && updateData.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: updateData.email } });
      if (emailTaken) {
        return res.status(422).json({ errors: { email: ['has already been taken'] } });
      }
    }

    if (updateData.username && updateData.username !== existing.username) {
      const usernameTaken = await prisma.user.findUnique({ where: { username: updateData.username } });
      if (usernameTaken) {
        return res.status(422).json({ errors: { username: ['has already been taken'] } });
      }
    }

    const dataToUpdate: any = {};
    if (updateData.email !== undefined) dataToUpdate.email = updateData.email;
    if (updateData.username !== undefined) dataToUpdate.username = updateData.username;
    if (updateData.bio !== undefined) dataToUpdate.bio = updateData.bio;
    if (updateData.image !== undefined) dataToUpdate.image = updateData.image;
    if (updateData.password !== undefined && updateData.password !== '') {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: dataToUpdate
    });

    const token = generateToken(updatedUser.id);

    return res.status(200).json({
      user: {
        email: updatedUser.email,
        token,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image
      }
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

export default router;
