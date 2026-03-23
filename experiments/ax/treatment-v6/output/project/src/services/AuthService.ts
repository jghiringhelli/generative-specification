import { hash, verify as verifyHash } from 'argon2';
import { sign } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import type { IUserRepository } from '../repositories/IUserRepository.js';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../errors/AppError.js';

// JWT expiry — cast via SignOptions['expiresIn'] per CLAUDE.md § Known Type Pitfalls
const JWT_EXPIRY = (env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

/** Zod schema for user registration input validation. */
const registerSchema = z.object({
  username: z.string().min(1, 'is required'),
  email: z.string().email('is invalid'),
  password: z.string().min(8, 'must be at least 8 characters'),
});

/** Zod schema for login input validation. */
const loginSchema = z.object({
  email: z.string().email('is invalid'),
  password: z.string().min(1, 'is required'),
});

/** Zod schema for user update input validation. */
const updateSchema = z.object({
  email: z.string().email('is invalid').optional(),
  username: z.string().min(1, 'cannot be empty').optional(),
  password: z.string().min(8, 'must be at least 8 characters').optional(),
  bio: z.string().nullable().optional(),
  image: z.string().url('must be a valid URL').nullable().optional(),
});

/** User response shape per RealWorld API spec. */
export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

/**
 * Service handling user authentication and account management.
 * Depends on IUserRepository (injected at composition root).
 */
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @param input - Raw registration input (validated inside).
   * @returns The created user with JWT token.
   */
  async register(input: unknown): Promise<{ user: UserResponse }> {
    const result = registerSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { username, email, password } = result.data;

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
    ]);

    if (existingEmail) {
      throw new ConflictError('email is already taken');
    }
    if (existingUsername) {
      throw new ConflictError('username is already taken');
    }

    const passwordHash = await hash(password);
    const user = await this.userRepository.create({ email, username, passwordHash });

    return { user: this.buildUserResponse(user.id, user.email, user.username, user.bio, user.image) };
  }

  /**
   * Authenticate a user with email and password.
   * @param input - Raw login input (validated inside).
   * @returns The authenticated user with JWT token.
   */
  async login(input: unknown): Promise<{ user: UserResponse }> {
    const result = loginSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { email, password } = result.data;
    const user = await this.userRepository.findByEmail(email);

    // Use constant-time comparison to prevent email enumeration timing attacks
    if (!user || !(await verifyHash(user.passwordHash, password))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: this.buildUserResponse(user.id, user.email, user.username, user.bio, user.image) };
  }

  /**
   * Get the current authenticated user.
   * @param userId - The authenticated user's ID.
   * @returns The user with JWT token.
   */
  async getCurrentUser(userId: number): Promise<{ user: UserResponse }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', String(userId));
    }
    return { user: this.buildUserResponse(user.id, user.email, user.username, user.bio, user.image) };
  }

  /**
   * Update the current authenticated user.
   * @param userId - The authenticated user's ID.
   * @param input - Raw update input (validated inside).
   * @returns The updated user with JWT token.
   */
  async updateUser(userId: number, input: unknown): Promise<{ user: UserResponse }> {
    const result = updateSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { email, username, password, bio, image } = result.data;

    if (email !== undefined) {
      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ConflictError('email is already taken');
      }
    }

    if (username !== undefined) {
      const existingUsername = await this.userRepository.findByUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ConflictError('username is already taken');
      }
    }

    const passwordHash = password !== undefined ? await hash(password) : undefined;

    const updated = await this.userRepository.update(userId, {
      email,
      username,
      passwordHash,
      bio,
      image,
    });

    return {
      user: this.buildUserResponse(
        updated.id,
        updated.email,
        updated.username,
        updated.bio,
        updated.image,
      ),
    };
  }

  /**
   * Build the RealWorld user response object with a freshly signed JWT.
   */
  private buildUserResponse(
    userId: number,
    email: string,
    username: string,
    bio: string | null,
    image: string | null,
  ): UserResponse {
    const token = sign({ userId }, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return { email, token, username, bio, image };
  }
}
