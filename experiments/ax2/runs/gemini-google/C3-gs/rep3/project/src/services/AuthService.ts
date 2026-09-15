// src/services/AuthService.ts
import argon2 from 'argon2';
import pkg from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { JWT_SECRET, JWT_EXPIRY } from '../config/env';

const { sign } = pkg;

export interface RegisterInput {
  email: string;
  username: string;
  password?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export interface UserResponseDto {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  public generateToken(user: UserEntity): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    const options: SignOptions = {
      expiresIn: JWT_EXPIRY
    };
    return sign(payload, JWT_SECRET, options);
  }

  public toUserResponse(user: UserEntity, token?: string): UserResponseDto {
    return {
      email: user.email,
      token: token ?? this.generateToken(user),
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  public async register(input: RegisterInput): Promise<UserResponseDto> {
    const errors: Record<string, string[]> = {};

    if (!input.email || !input.email.trim()) {
      errors.email = ["can't be blank"];
    }
    if (!input.username || !input.username.trim()) {
      errors.username = ["can't be blank"];
    }
    if (!input.password || !input.password.trim()) {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError('Email already taken', {
        email: ['has already been taken']
      });
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ValidationError('Username already taken', {
        username: ['has already been taken']
      });
    }

    const passwordHash = await argon2.hash(input.password as string);
    const user = await this.userRepository.create({
      email: input.email.trim(),
      username: input.username.trim(),
      passwordHash
    });

    return this.toUserResponse(user);
  }

  public async login(input: LoginInput): Promise<UserResponseDto> {
    const errors: Record<string, string[]> = {};

    if (!input.email || !input.email.trim()) {
      errors.email = ["can't be blank"];
    }
    if (!input.password || !input.password.trim()) {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    const user = await this.userRepository.findByEmail(input.email.trim());
    if (!user) {
      throw new ValidationError('Invalid credentials', {
        'email or password': ['is invalid']
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password as string);
    if (!validPassword) {
      throw new ValidationError('Invalid credentials', {
        'email or password': ['is invalid']
      });
    }

    return this.toUserResponse(user);
  }

  public async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toUserResponse(user);
  }

  public async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(input.email);
      if (emailTaken && emailTaken.id !== userId) {
        throw new ValidationError('Email already taken', {
          email: ['has already been taken']
        });
      }
    }

    if (input.username && input.username !== existing.username) {
      const usernameTaken = await this.userRepository.findByUsername(input.username);
      if (usernameTaken && usernameTaken.id !== userId) {
        throw new ValidationError('Username already taken', {
          username: ['has already been taken']
        });
      }
    }

    let passwordHash: string | undefined;
    if (input.password && input.password.trim()) {
      passwordHash = await argon2.hash(input.password);
    }

    const updated = await this.userRepository.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image
    });

    return this.toUserResponse(updated);
  }
}
