// src/services/AuthService.ts
import * as argon2 from 'argon2';
import pkg, { SignOptions } from 'jsonwebtoken';
const { sign } = pkg;
import { IUserRepository } from '../repositories/IUserRepository';
import { UserResponse } from '../types';
import { ValidationError, UnauthorizedError, NotFoundError } from '../errors/AppError';

export interface RegisterInput {
  email?: string;
  username?: string;
  password?: string;
}

export interface LoginInput {
  email?: string;
  password?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export class AuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  generateToken(user: { id: string; email: string; username: string }): string {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

    return sign(
      {
        id: user.id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  async register(input: RegisterInput): Promise<UserResponse> {
    const errors: Record<string, string[]> = {};

    if (!input.email || input.email.trim() === '') {
      errors.email = ["can't be blank"];
    }
    if (!input.username || input.username.trim() === '') {
      errors.username = ["can't be blank"];
    }
    if (!input.password || input.password.trim() === '') {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const email = input.email!.trim();
    const username = input.username!.trim();
    const password = input.password!;

    const { emailExists, usernameExists } = await this.userRepository.existsByEmailOrUsername(email, username);
    if (emailExists) {
      errors.email = ['has already been taken'];
    }
    if (usernameExists) {
      errors.username = ['has already been taken'];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const hashedPassword = await argon2.hash(password);
    const createdUser = await this.userRepository.create({
      email,
      username,
      password: hashedPassword
    });

    const token = this.generateToken(createdUser);

    return {
      email: createdUser.email,
      token,
      username: createdUser.username,
      bio: createdUser.bio,
      image: createdUser.image
    };
  }

  async login(input: LoginInput): Promise<UserResponse> {
    const errors: Record<string, string[]> = {};

    if (!input.email || input.email.trim() === '') {
      errors.email = ["can't be blank"];
    }
    if (!input.password || input.password.trim() === '') {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const user = await this.userRepository.findByEmail(input.email!.trim());
    if (!user) {
      throw new ValidationError({ 'email or password': ['is invalid'] });
    }

    const isPasswordValid = await argon2.verify(user.password, input.password!);
    if (!isPasswordValid) {
      throw new ValidationError({ 'email or password': ['is invalid'] });
    }

    const token = this.generateToken(user);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  async getCurrentUser(userId: string, currentToken: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      email: user.email,
      token: currentToken,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  async updateUser(userId: string, input: UpdateUserInput, currentToken: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const errors: Record<string, string[]> = {};

    if (input.email !== undefined && input.email.trim() !== user.email) {
      const emailExists = await this.userRepository.findByEmail(input.email.trim());
      if (emailExists) {
        errors.email = ['has already been taken'];
      }
    }

    if (input.username !== undefined && input.username.trim() !== user.username) {
      const usernameExists = await this.userRepository.findByUsername(input.username.trim());
      if (usernameExists) {
        errors.username = ['has already been taken'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    let hashedPassword: string | undefined;
    if (input.password && input.password.trim() !== '') {
      hashedPassword = await argon2.hash(input.password);
    }

    const updated = await this.userRepository.update(userId, {
      ...(input.email !== undefined && { email: input.email.trim() }),
      ...(input.username !== undefined && { username: input.username.trim() }),
      ...(hashedPassword !== undefined && { password: hashedPassword }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.image !== undefined && { image: input.image })
    });

    const token = (input.email || input.username) ? this.generateToken(updated) : currentToken;

    return {
      email: updated.email,
      token,
      username: updated.username,
      bio: updated.bio,
      image: updated.image
    };
  }
}
