import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ValidationError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export async function register(data: RegisterData) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { username: data.username }
      ]
    }
  });

  if (existingUser) {
    throw new ValidationError('Email or username already exists');
  }

  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword
    }
  });

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function login(data: LoginData) {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function updateUser(userId: number, data: UpdateUserData) {
  const updateData: any = {};

  if (data.email) updateData.email = data.email;
  if (data.username) updateData.username = data.username;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}
