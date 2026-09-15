import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AuthenticatedRequest, UserResponse } from '../types';
import { generateToken, extractToken } from '../utils/jwt';

const formatUserResponse = (user: {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
}, token?: string): UserResponse => {
  return {
    email: user.email,
    token: token || generateToken({ id: user.id, email: user.email, username: user.username }),
    username: user.username,
    bio: user.bio || '',
    image: user.image || ''
  };
};

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    id: newUser.id,
    email: newUser.email,
    username: newUser.username
  });

  res.status(201).json({
    user: formatUserResponse(newUser, token)
  });
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

  const isValidPassword = await bcrypt.compare(password, foundUser.password);
  if (!isValidPassword) {
    res.status(422).json({ errors: { 'email or password': ['is invalid'] } });
    return;
  }

  const token = generateToken({
    id: foundUser.id,
    email: foundUser.email,
    username: foundUser.username
  });

  res.status(200).json({
    user: formatUserResponse(foundUser, token)
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!foundUser) {
    res.status(404).json({ errors: { user: ['not found'] } });
    return;
  }

  const token = extractToken(req) || generateToken({
    id: foundUser.id,
    email: foundUser.email,
    username: foundUser.username
  });

  res.status(200).json({
    user: formatUserResponse(foundUser, token)
  });
};

export const updateCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { user } = req.body || {};
  if (!user) {
    res.status(422).json({ errors: { body: ["can't be empty"] } });
    return;
  }

  const updateData: {
    email?: string;
    username?: string;
    password?: string;
    bio?: string;
    image?: string;
  } = {};

  if (user.email !== undefined && user.email !== req.user.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: user.email } });
    if (existingEmail && existingEmail.id !== req.user.id) {
      res.status(422).json({ errors: { email: ['has already been taken'] } });
      return;
    }
    updateData.email = user.email;
  }

  if (user.username !== undefined && user.username !== req.user.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username: user.username } });
    if (existingUsername && existingUsername.id !== req.user.id) {
      res.status(422).json({ errors: { username: ['has already been taken'] } });
      return;
    }
    updateData.username = user.username;
  }

  if (user.password !== undefined) {
    if (user.password.trim() === '') {
      res.status(422).json({ errors: { password: ["can't be blank"] } });
      return;
    }
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

  const token = generateToken({
    id: updatedUser.id,
    email: updatedUser.email,
    username: updatedUser.username
  });

  res.status(200).json({
    user: formatUserResponse(updatedUser, token)
  });
};
