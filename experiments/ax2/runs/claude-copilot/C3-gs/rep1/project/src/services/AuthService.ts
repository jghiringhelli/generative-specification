import { User } from '@prisma/client';
import pkg, { SignOptions } from 'jsonwebtoken';
import { loadConfig } from '../config/env';
import {
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError';
import { IUserRepository } from '../repositories/IUserRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { validate } from '../validation/validate';
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
} from '../validation/userSchemas';

const { sign } = pkg;

const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

/**
 * Result of an authentication operation: the user and a freshly signed token.
 */
export interface AuthResult {
  user: User;
  token: string;
}

/**
 * Application service handling registration, login, and current-user operations.
 */
export class AuthService {
  private readonly userRepository: IUserRepository;

  /**
   * @param userRepository - User persistence port.
   */
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Sign a JWT for the given user.
   * @param user - The user to encode.
   * @returns A signed JWT string.
   */
  generateToken(user: User): string {
    const { jwtSecret } = loadConfig();
    return sign({ id: user.id, username: user.username }, jwtSecret, {
      expiresIn: JWT_EXPIRY,
    });
  }

  /**
   * Register a new user.
   * @param input - Raw registration payload.
   * @returns The created user and a token.
   */
  async register(input: unknown): Promise<AuthResult> {
    const { user } = validate(registerSchema, input);
    await this.assertUnique(user.email, user.username);
    const passwordHash = await hashPassword(user.password);
    const created = await this.userRepository.create({
      email: user.email,
      username: user.username,
      passwordHash,
    });
    return { user: created, token: this.generateToken(created) };
  }

  /**
   * Authenticate an existing user.
   * @param input - Raw login payload.
   * @returns The authenticated user and a token.
   */
  async login(input: unknown): Promise<AuthResult> {
    const { user } = validate(loginSchema, input);
    const found = await this.userRepository.findByEmail(user.email);
    if (!found) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const matches = await verifyPassword(found.passwordHash, user.password);
    if (!matches) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return { user: found, token: this.generateToken(found) };
  }

  /**
   * Load the current authenticated user.
   * @param userId - Authenticated user id.
   * @returns The user and a token.
   */
  async getCurrentUser(userId: number): Promise<AuthResult> {
    const found = await this.userRepository.findById(userId);
    if (!found) {
      throw new UnauthorizedError('User not found');
    }
    return { user: found, token: this.generateToken(found) };
  }

  /**
   * Update the current user's mutable fields.
   * @param userId - Authenticated user id.
   * @param input - Raw update payload.
   * @returns The updated user and a token.
   */
  async updateUser(userId: number, input: unknown): Promise<AuthResult> {
    const { user } = validate(updateUserSchema, input);
    await this.assertUniqueForUpdate(userId, user.email, user.username);
    const passwordHash = user.password ? await hashPassword(user.password) : undefined;
    const updated = await this.userRepository.update(userId, {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      passwordHash,
    });
    return { user: updated, token: this.generateToken(updated) };
  }

  /**
   * Ensure email and username are not already taken.
   * @param email - Candidate email.
   * @param username - Candidate username.
   */
  private async assertUnique(email: string, username: string): Promise<void> {
    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictError('email has already been taken');
    }
    if (await this.userRepository.findByUsername(username)) {
      throw new ConflictError('username has already been taken');
    }
  }

  /**
   * Ensure updated email/username do not collide with another user.
   * @param userId - The updating user's id.
   * @param email - Candidate email, if changing.
   * @param username - Candidate username, if changing.
   */
  private async assertUniqueForUpdate(
    userId: number,
    email?: string,
    username?: string,
  ): Promise<void> {
    if (email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== userId) {
        throw new ConflictError('email has already been taken');
      }
    }
    if (username) {
      const existing = await this.userRepository.findByUsername(username);
      if (existing && existing.id !== userId) {
        throw new ConflictError('username has already been taken');
      }
    }
  }
}
