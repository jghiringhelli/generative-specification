import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth';
import { generateToken } from '../utils/jwt';
import { AuthRequest, UserResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/users - Register
router.post('/users', async (req, res) => {
  try {
    const { user } = req.body;

    if (!user || !user.email || !user.username || !user.password) {
      return res.status(422).json({
        errors: { body: ['Email, username, and password are required'] }
      });
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        username: user.username,
        password: hashedPassword
      }
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username
    });

    const response: UserResponse = {
      user: {
        email: newUser.email,
        token,
        username: newUser.username,
        bio: newUser.bio,
        image: newUser.image
      }
    };

    return res.status(201).json(response);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(422).json({
        errors: { body: ['Email or username already taken'] }
      });
    }
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

// POST /api/users/login - Login
router.post('/users/login', async (req, res) => {
  try {
    const { user } = req.body;

    if (!user || !user.email || !user.password) {
      return res.status(422).json({
        errors: { body: ['Email and password are required'] }
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!existingUser) {
      return res.status(401).json({
        errors: { body: ['Invalid email or password'] }
      });
    }

    const validPassword = await bcrypt.compare(
      user.password,
      existingUser.password
    );

    if (!validPassword) {
      return res.status(401).json({
        errors: { body: ['Invalid email or password'] }
      });
    }

    const token = generateToken({
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username
    });

    const response: UserResponse = {
      user: {
        email: existingUser.email,
        token,
        username: existingUser.username,
        bio: existingUser.bio,
        image: existingUser.image
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

// GET /api/user - Get current user
router.get('/user', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        errors: { body: ['User not found'] }
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    const response: UserResponse = {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

// PUT /api/user - Update user
router.put('/user', authenticate, async (req: AuthRequest, res) => {
  try {
    const { user } = req.body;

    if (!user) {
      return res.status(422).json({
        errors: { body: ['User data is required'] }
      });
    }

    const updateData: any = {};

    if (user.email) updateData.email = user.email;
    if (user.username) updateData.username = user.username;
    if (user.bio !== undefined) updateData.bio = user.bio;
    if (user.image !== undefined) updateData.image = user.image;
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData
    });

    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username
    });

    const response: UserResponse = {
      user: {
        email: updatedUser.email,
        token,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image
      }
    };

    return res.status(200).json(response);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(422).json({
        errors: { body: ['Email or username already taken'] }
      });
    }
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

export default router;
