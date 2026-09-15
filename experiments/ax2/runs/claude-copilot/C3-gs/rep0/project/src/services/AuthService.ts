import pkg, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { IUserRepository } from '../repositories/IUserRepository';
import { PasswordHasher } from '../utils/PasswordHasher';
import { toUserResponse, UserResponse } from '../dto/userView';
import { ConflictError, UnauthorizedError } from '../errors/AppError';
import { parseOrThrow } from '../utils/validation';
import { UserEntity } from '../domain/types';

const { sign } = pkg;

// process.env.JWT_EXPIRY is `string | undefined` and is NOT directly assignable
// to SignOptions['expiresIn']; cast per CLAUDE.md § Known Type Pitfalls.
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank"),
    email: z.string().min(1, "can't be blank").email('is invalid'),
    password: z.string().min(1, "can't be blank")
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email('is invalid'),
    password: z.string().min(1, "can't be blank")
  })
});

const updateSchema = z.object({
  user: z
    .object({
      username: z.string().min(1, "can't be blank").optional(),
      email: z.string().min(1, "can't be blank").email('is invalid').optional(),
      password: z.string().min(1, "can't be blank").optional(),
      bio: z.string().optional(),
      image: z.string().url('is invalid').or(z.literal('')).optional()
    })
    .strict()
});

/**
 * Business logic for user authentication and account management.
 */
export class AuthService {
  /**
   * @param userRepository - User persistence port.
   * @param passwordHasher - Password hashing port.
   * @param jwtSecret - Secret used to sign JWTs.
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtSecret: string
  ) {}

  /**
   * Register a new user.
   * @param input - Raw request body.
   * @returns The created user with a fresh token.
   */
  async register(input: unknown): Promise<UserResponse> {
    const { user } = parseOrThrow(registerSchema, input);
    if (await this.userRepository.findByEmail(user.email)) {
      throw new ConflictError('email has already been taken');
    }
    if (await this.userRepository.findByUsername(user.username)) {
      throw new ConflictError('username has already been taken');
    }
    const passwordHash = await this.passwordHasher.hash(user.password);
    const created = await this.userRepository.create({
      email: user.email,
      username: user.username,
      passwordHash
    });
    return toUserResponse(created, this.issueToken(created.id));
  }

  /**
   * Authenticate a user by email and password.
   * @param input - Raw request body.
   * @returns The user with a fresh token.
   */
  async login(input: unknown): Promise<UserResponse> {
    const { user } = parseOrThrow(loginSchema, input);
    const found = await this.userRepository.findByEmail(user.email);
    if (!found) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const valid = await this.passwordHasher.verify(found.passwordHash, user.password);
    if (!valid) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return toUserResponse(found, this.issueToken(found.id));
  }

  /**
   * Return the current user, re-issuing a token.
   * @param user - The authenticated user entity.
   * @returns The user with a fresh token.
   */
  async getCurrentUser(user: UserEntity): Promise<UserResponse> {
    return toUserResponse(user, this.issueToken(user.id));
  }

  /**
   * Update mutable fields of the current user.
   * @param user - The authenticated user entity.
   * @param input - Raw request body.
   * @returns The updated user with a fresh token.
   */
  async updateUser(user: UserEntity, input: unknown): Promise<UserResponse> {
    const { user: patch } = parseOrThrow(updateSchema, input);

    if (patch.email && patch.email !== user.email) {
      const existing = await this.userRepository.findByEmail(patch.email);
      if (existing && existing.id !== user.id) {
        throw new ConflictError('email has already been taken');
      }
    }
    if (patch.username && patch.username !== user.username) {
      const existing = await this.userRepository.findByUsername(patch.username);
      if (existing && existing.id !== user.id) {
        throw new ConflictError('username has already been taken');
      }
    }

    const passwordHash = patch.password
      ? await this.passwordHasher.hash(patch.password)
      : undefined;

    const updated = await this.userRepository.update(user.id, {
      email: patch.email,
      username: patch.username,
      bio: patch.bio,
      image: patch.image === '' ? null : patch.image,
      passwordHash
    });
    return toUserResponse(updated, this.issueToken(updated.id));
  }

  /**
   * Sign a JWT for the given user id.
   * @param userId - The user's id.
   * @returns The signed token.
   */
  private issueToken(userId: number): string {
    return sign({ userId }, this.jwtSecret, { expiresIn: JWT_EXPIRY });
  }
}
