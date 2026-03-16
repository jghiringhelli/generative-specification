
/**
 * Authentication service.
 * Handles user registration, login, and profile updates.
 * No direct database access — delegates to repository.
 */

import * as argon2 from 'argon2';
import type { IUserRepository } from '../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { signToken } from '../utils/jwt';

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @throws ValidationError if email or username already exists
   */
  async register(input: {
    email: string;
    username: string;
    password: string;
  }): Promise<UserResponse> {
    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError('email already taken');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ValidationError('username already taken');
    }

    // Hash password
    const passwordHash = await argon2.hash(input.password);

    // Create user
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash
    });

    // Generate token
    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Authenticate user with email and password.
   * @throws ValidationError if credentials are invalid (generic message)
   */
  async login(input: {
    email: string;
    password: string;
  }): Promise<UserResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError('email or password is invalid');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw new ValidationError('email or password is invalid');
    }

    // Generate token
    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Get current user by ID.
   * @throws NotFoundError if user does not exist
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Update user profile.
   * @throws NotFoundError if user does not exist
   * @throws ValidationError if email/username conflicts with another user
   */
  async updateUser(
    userId: number,
    input: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string;
      image?: string;
    }
  ): Promise<UserResponse> {
    // If updating email, check for conflicts
    if (input.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ValidationError('email already taken');
      }
    }

    // If updating username, check for conflicts
    if (input.username) {
      const existing = await this.userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ValidationError('username already taken');
      }
    }

    // Hash password if provided
    const updateData: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string;
      image?: string;
    } = {
      email: input.email,
      username: input.username,
      bio: input.bio,
      image: input.image
    };

    if (input.password) {
      updateData.passwordHash = await argon2.hash(input.password);
    }

    const user = await this.userRepository.update(userId, updateData);

    const token = signToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
