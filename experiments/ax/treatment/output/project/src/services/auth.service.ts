import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { IUserRepository } from '../repositories/user.repository';
import {
  RegisterDTO,
  LoginDTO,
  UpdateUserDTO,
  UserResponse
} from '../types/user.types';
import { ValidationError, AuthenticationError, NotFoundError } from '../errors';
import { JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS } from '../config/constants';

/**
 * Authentication service.
 * Handles user registration, login, and token generation.
 */
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @throws ValidationError if email or username already exists
   */
  async register(dto: RegisterDTO): Promise<UserResponse> {
    await this.validateUniqueEmail(dto.email);
    await this.validateUniqueUsername(dto.username);

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash
    });

    return this.buildUserResponse(user);
  }

  /**
   * Authenticate user and return token.
   * @throws AuthenticationError if credentials invalid
   */
  async login(dto: LoginDTO): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new AuthenticationError('Email or password is invalid');
    }

    const isPasswordValid = await this.verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Email or password is invalid');
    }

    return this.buildUserResponse(user);
  }

  /**
   * Get user by ID.
   * @throws NotFoundError if user does not exist
   */
  async getUserById(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return this.buildUserResponse(user);
  }

  /**
   * Update user profile.
   * @throws NotFoundError if user does not exist
   * @throws ValidationError if email/username conflict
   */
  async updateUser(userId: number, dto: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    if (dto.email && dto.email !== user.email) {
      await this.validateUniqueEmail(dto.email);
    }

    if (dto.username && dto.username !== user.username) {
      await this.validateUniqueUsername(dto.username);
    }

    const updateData: UpdateUserDTO & { passwordHash?: string } = { ...dto };

    if (dto.password) {
      updateData.passwordHash = await this.hashPassword(dto.password);
      delete updateData.password;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    return this.buildUserResponse(updatedUser);
  }

  /**
   * Generate JWT token for user.
   */
  generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY } as SignOptions);
  }

  /**
   * Verify JWT token and extract user ID.
   * @throws AuthenticationError if token invalid
   */
  verifyToken(token: string): number {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: number };
      return decoded.userId;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Hash password using bcrypt.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify password against hash.
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate email is not already taken.
   * @throws ValidationError if email exists
   */
  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ValidationError('Email is already taken');
    }
  }

  /**
   * Validate username is not already taken.
   * @throws ValidationError if username exists
   */
  private async validateUniqueUsername(username: string): Promise<void> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing) {
      throw new ValidationError('Username is already taken');
    }
  }

  /**
   * Build user response DTO with token.
   */
  private buildUserResponse(user: User): UserResponse {
    return {
      email: user.email,
      token: this.generateToken(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
