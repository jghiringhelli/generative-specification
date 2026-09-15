import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req.body || {};
    if (!user) {
      res.status(422).json({ errors: { body: ["can't be empty"] } });
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
      res.status(422).json({ errors: { email: ['has already been taken'] } });
      return;
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      res.status(422).json({ errors: { username: ['has already been taken'] } });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        bio: '',
        image: ''
      }
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        token,
        username: newUser.username,
        bio: newUser.bio || '',
        image: newUser.image || ''
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { user } = req.body || {};
    if (!user) {
      res.status(422).json({ errors: { body: ["can't be empty"] } });
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

    const foundUser = await prisma.user.findUnique({ where: { email } });
    if (!foundUser) {
      res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
      return;
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
      return;
    }

    const token = generateToken({
      userId: foundUser.id,
      email: foundUser.email,
      username: foundUser.username
    });

    res.status(200).json({
      user: {
        email: foundUser.email,
        token,
        username: foundUser.username,
        bio: foundUser.bio || '',
        image: foundUser.image || ''
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ errors: { message: ['User not found'] } });
      return;
    }

    const token = req.user.token || generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    res.status(200).json({
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio || '',
        image: user.image || ''
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { user: updateData } = req.body || {};
    if (!updateData) {
      res.status(422).json({ errors: { body: ["can't be empty"] } });
      return;
    }

    const dataToUpdate: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string;
      image?: string;
    } = {};

    if (updateData.email && updateData.email !== req.user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: updateData.email } });
      if (existingEmail && existingEmail.id !== req.user.id) {
        res.status(422).json({ errors: { email: ['has already been taken'] } });
        return;
      }
      dataToUpdate.email = updateData.email;
    }

    if (updateData.username && updateData.username !== req.user.username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: updateData.username } });
      if (existingUsername && existingUsername.id !== req.user.id) {
        res.status(422).json({ errors: { username: ['has already been taken'] } });
        return;
      }
      dataToUpdate.username = updateData.username;
    }

    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    if (typeof updateData.bio !== 'undefined') {
      dataToUpdate.bio = updateData.bio;
    }

    if (typeof updateData.image !== 'undefined') {
      dataToUpdate.image = updateData.image;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate
    });

    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username
    });

    res.status(200).json({
      user: {
        email: updatedUser.email,
        token,
        username: updatedUser.username,
        bio: updatedUser.bio || '',
        image: updatedUser.image || ''
      }
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}
