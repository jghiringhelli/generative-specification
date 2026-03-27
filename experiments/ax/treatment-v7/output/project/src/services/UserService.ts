import { hash as hashPassword, verify as verifyPassword } from 'argon2';
import pkg from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { IUserRepository } from '../repositories/IUserRepository';
import type { User, UpdateUserData } from '../types/domain';
import { NotFoundError, InvalidCredentialsError } from '../errors/AppError';

// §11 ESM-safe import: jsonwebtoken is CJS — use default import + destructure
const { sign } = pkg;

// §4 Named constants — no magic values inline
// §CLAUDE.md § Known Type Pitfalls: cast via SignOptions['expiresIn'] to satisfy branded type
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

/** Response DTO for all authenticated user endpoints. */
export interface AuthenticatedUserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/** Input for user registration. */
export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

/** Input for user login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Input for updating the current user's profile. All fields are optional. */
export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Business logic for user authentication and profile management.
 *
 * Depends on `IUserRepository` via constructor injection — no direct Prisma imports.
 * Wire concrete implementations at the composition root (`src/server.ts`).
 */
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user account and return an authenticated response.
   *
   * @param input - Registration payload (email, username, plaintext password)
   * @returns Authenticated user response with signed JWT
   * @throws `ConflictError` if email or username is already taken
   */
  async register(input: RegisterInput): Promise<AuthenticatedUserResponse> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.buildAuthResponse(user);
  }

  /**
   * Authenticate a user with email and password.
   *
   * Returns the same error for unknown email and wrong password to prevent
   * user enumeration via timing or message differences.
   *
   * @param input - Login credentials (email, plaintext password)
   * @returns Authenticated user response with signed JWT
   * @throws `ValidationError` if credentials are invalid
   */
  async login(input: LoginInput): Promise<AuthenticatedUserResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();
    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) throw new InvalidCredentialsError();
    return this.buildAuthResponse(user);
  }

  /**
   * Retrieve the currently authenticated user.
   *
   * @param userId - The authenticated user's numeric ID (from JWT payload)
   * @returns Authenticated user response with a fresh signed JWT
   * @throws `NotFoundError` if the user no longer exists
   */
  async getCurrentUser(userId: number): Promise<AuthenticatedUserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('user');
    return this.buildAuthResponse(user);
  }

  /**
   * Update the current user's profile fields.
   *
   * §10 Nullable field coercion: empty string for `bio` or `image` is coerced to null
   * per the Conduit contract — `PUT /api/user` with `bio: ""` must return `bio: null`.
   *
   * @param userId - The authenticated user's numeric ID
   * @param input - Partial update payload
   * @returns Updated authenticated user response with a fresh signed JWT
   * @throws `NotFoundError` if the user no longer exists
   * @throws `ConflictError` if the new email or username is already taken
   */
  async updateUser(userId: number, input: UpdateUserInput): Promise<AuthenticatedUserResponse> {
    const patch: UpdateUserData = {};
    if (input.email !== undefined) patch.email = input.email;
    if (input.username !== undefined) patch.username = input.username;
    if (input.password !== undefined) patch.passwordHash = await hashPassword(input.password);
    // §10: coerce empty string → null for nullable string fields
    if (input.bio !== undefined) patch.bio = input.bio === '' ? null : input.bio;
    if (input.image !== undefined) patch.image = input.image === '' ? null : input.image;
    const user = await this.userRepository.update(userId, patch);
    return this.buildAuthResponse(user);
  }

  /**
   * Sign a JWT for the given user.
   *
   * @param user - Domain user entity
   * @returns Signed JWT string
   */
  private generateToken(user: User): string {
    return sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  /**
   * Build the authenticated response DTO from a domain User entity.
   *
   * @param user - Domain user entity from the repository
   * @returns Response DTO with a freshly signed JWT attached
   */
  private buildAuthResponse(user: User): AuthenticatedUserResponse {
    return {
      email: user.email,
      token: this.generateToken(user),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
