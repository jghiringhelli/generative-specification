import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth';

export async function registerUser(req: Request, res: Response) {
  const { user } = req.body || {};
  if (!user) {
    return res.status(422).json({ errors: { body: ["can't be empty"] } });
  }

  const { username, email, password } = user;
  const errors: Record<string, string[]> = {};

  if (!username) errors.username = ["can't be blank"];
  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(422).json({ errors: { email: ['has already been taken'] } });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(422).json({ errors: { username: ['has already been taken'] } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        bio: user.bio || '',
        image: user.image || 'https://api.realworld.io/images/smiley-cyrus.jpg'
      }
    });

    const token = generateToken({ id: createdUser.id, username: createdUser.username });

    return res.status(201).json({
      user: {
        email: createdUser.email,
        token,
        username: createdUser.username,
        bio: createdUser.bio,
        image: createdUser.image
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function loginUser(req: Request, res: Response) {
  const { user } = req.body || {};
  if (!user) {
    return res.status(422).json({ errors: { body: ["can't be empty"] } });
  }

  const { email, password } = user;
  const errors: Record<string, string[]> = {};

  if (!email) errors.email = ["can't be blank"];
  if (!password) errors.password = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const foundUser = await prisma.user.findUnique({ where: { email } });
    if (!foundUser) {
      return res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    }

    const token = generateToken({ id: foundUser.id, username: foundUser.username });

    return res.status(200).json({
      user: {
        email: foundUser.email,
        token,
        username: foundUser.username,
        bio: foundUser.bio,
        image: foundUser.image
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const token = generateToken({ id: req.user.id, username: req.user.username });

  return res.status(200).json({
    user: {
      email: req.user.email,
      token,
      username: req.user.username,
      bio: req.user.bio,
      image: req.user.image
    }
  });
}

export async function updateCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { user } = req.body || {};
  if (!user) {
    return res.status(422).json({ errors: { body: ["can't be empty"] } });
  }

  const updateData: {
    email?: string;
    username?: string;
    password?: string;
    bio?: string;
    image?: string;
  } = {};

  try {
    if (user.email && user.email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        return res.status(422).json({ errors: { email: ['has already been taken'] } });
      }
      updateData.email = user.email;
    }

    if (user.username && user.username !== req.user.username) {
      const existing = await prisma.user.findUnique({ where: { username: user.username } });
      if (existing) {
        return res.status(422).json({ errors: { username: ['has already been taken'] } });
      }
      updateData.username = user.username;
    }

    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }

    if (user.bio !== undefined) {
      updateData.bio = user.bio;
    }

    if (user.image !== undefined) {
      updateData.image = user.image;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    const token = generateToken({ id: updatedUser.id, username: updatedUser.username });

    return res.status(200).json({
      user: {
        email: updatedUser.email,
        token,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image
      }
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}
