import { UserRepository, userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { ValidationError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { UserResponse } from '../types';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export class UserService {
  constructor(private userRepo: UserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<UserResponse> {
    const existingEmail = await this.userRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError('email is already registered');
    }

    const existingUsername = await this.userRepo.findByUsername(input.username);
    if (existingUsername) {
      throw new ValidationError('username is already registered');
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      username: input.username,
      password: hashedPassword
    });

    const token = signToken({ id: user.id, email: user.email, username: user.username });
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    };
  }

  async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new ValidationError('invalid email or password');
    }

    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('invalid email or password');
    }

    const token = signToken({ id: user.id, email: user.email, username: user.username });
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    };
  }

  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const token = signToken({ id: user.id, email: user.email, username: user.username });
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    };
  }

  async updateUser(userId: number, input: UpdateUserInput): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existingEmail = await this.userRepo.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ValidationError('email is already taken');
      }
    }

    if (input.username && input.username !== user.username) {
      const existingUsername = await this.userRepo.findByUsername(input.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ValidationError('username is already taken');
      }
    }

    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    const updated = await this.userRepo.update(userId, {
      email: input.email,
      username: input.username,
      password: hashedPassword,
      bio: input.bio,
      image: input.image
    });

    const token = signToken({ id: updated.id, email: updated.email, username: updated.username });
    return {
      user: {
        email: updated.email,
        token,
        username: updated.username,
        bio: updated.bio,
        image: updated.image
      }
    };
  }
}

export const userService = new UserService();
