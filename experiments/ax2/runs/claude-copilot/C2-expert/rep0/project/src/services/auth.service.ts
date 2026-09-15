import type { User } from '@prisma/client';
import { z } from 'zod';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/token';
import { parseOrThrow } from '../utils/validation';
import {
  UnauthorizedError,
  ValidationError
} from '../errors';

const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'username is required'),
    email: z.string().email('email must be valid'),
    password: z.string().min(1, 'password is required')
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email('email must be valid'),
    password: z.string().min(1, 'password is required')
  })
});

const updateSchema = z.object({
  user: z
    .object({
      username: z.string().min(1).optional(),
      email: z.string().email('email must be valid').optional(),
      password: z.string().min(1).optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

/** Public representation of a user including the auth token. */
export interface UserView {
  readonly email: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly token: string;
}

/**
 * Application service implementing authentication and current-user use cases.
 */
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly jwtSecret: string;

  constructor(userRepository: UserRepository, jwtSecret: string) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Registers a new user.
   * @param payload The raw request body.
   * @returns The created user view including a fresh token.
   * @throws {ValidationError} On invalid input or duplicate email/username.
   */
  async register(payload: unknown): Promise<UserView> {
    const { user } = parseOrThrow(registerSchema, payload);
    if (await this.userRepository.findByEmail(user.email)) {
      throw new ValidationError(['email is already registered']);
    }
    if (await this.userRepository.findByUsername(user.username)) {
      throw new ValidationError(['username is already taken']);
    }
    const created = await this.userRepository.create({
      email: user.email,
      username: user.username,
      password: await hashPassword(user.password)
    });
    return this.toView(created);
  }

  /**
   * Authenticates a user by email and password.
   * @param payload The raw request body.
   * @returns The user view including a fresh token.
   * @throws {ValidationError} On invalid credentials.
   */
  async login(payload: unknown): Promise<UserView> {
    const { user } = parseOrThrow(loginSchema, payload);
    const existing = await this.userRepository.findByEmail(user.email);
    if (!existing) {
      throw new ValidationError(['email or password is invalid']);
    }
    const matches = await verifyPassword(user.password, existing.password);
    if (!matches) {
      throw new ValidationError(['email or password is invalid']);
    }
    return this.toView(existing);
  }

  /**
   * Fetches the current user by id.
   * @param userId The authenticated user's id.
   * @returns The user view including a fresh token.
   * @throws {UnauthorizedError} When the user no longer exists.
   */
  async getCurrentUser(userId: number): Promise<UserView> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new UnauthorizedError();
    }
    return this.toView(existing);
  }

  /**
   * Updates the current user's profile fields.
   * @param userId The authenticated user's id.
   * @param payload The raw request body.
   * @returns The updated user view including a fresh token.
   */
  async updateUser(userId: number, payload: unknown): Promise<UserView> {
    const { user } = parseOrThrow(updateSchema, payload);
    const data: Record<string, unknown> = { ...user };
    if (user.password !== undefined) {
      data.password = await hashPassword(user.password);
    }
    const updated = await this.userRepository.update(userId, data);
    return this.toView(updated);
  }

  private toView(user: User): UserView {
    return {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: signToken({ id: user.id, username: user.username }, this.jwtSecret)
    };
  }
}
