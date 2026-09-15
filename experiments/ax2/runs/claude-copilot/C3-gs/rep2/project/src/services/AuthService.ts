import { IUserRepository } from '../repositories/IUserRepository';
import { UserDTO } from '../dto';
import { User } from '../domain/types';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/token';
import { ConflictError, UnauthorizedError, ValidationError } from '../errors/AppError';
import type { SignOptions } from 'jsonwebtoken';

/** Registration input (already validated). */
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

/** Login input (already validated). */
export interface LoginInput {
  email: string;
  password: string;
}

/** Update-user input (already validated). */
export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

/** Dependencies required to sign tokens. */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: SignOptions['expiresIn'];
}

/**
 * Business logic for user registration, login, and profile management.
 */
export class AuthService {
  private readonly users: IUserRepository;
  private readonly config: AuthConfig;

  /**
   * @param users - User repository port.
   * @param config - JWT signing configuration.
   */
  constructor(users: IUserRepository, config: AuthConfig) {
    this.users = users;
    this.config = config;
  }

  /**
   * Register a new user.
   * @param input - Validated registration fields.
   * @returns The authenticated user view with a fresh token.
   * @throws ConflictError if the email or username is already taken.
   */
  async register(input: RegisterInput): Promise<UserDTO> {
    await this.assertUnique(input.email, input.username);
    const passwordHash = await hashPassword(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.toUserDTO(user);
  }

  /**
   * Authenticate a user by email and password.
   * @param input - Validated login fields.
   * @returns The authenticated user view with a fresh token.
   * @throws UnauthorizedError if credentials are invalid.
   */
  async login(input: LoginInput): Promise<UserDTO> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return this.toUserDTO(user);
  }

  /**
   * Fetch the current user's view.
   * @param userId - Authenticated user id.
   * @returns The authenticated user view with a fresh token.
   * @throws UnauthorizedError if the user no longer exists.
   */
  async getCurrentUser(userId: number): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.toUserDTO(user);
  }

  /**
   * Update the current user's fields.
   * @param userId - Authenticated user id.
   * @param input - Validated update fields.
   * @returns The updated authenticated user view.
   * @throws ConflictError if a new email or username collides.
   */
  async updateUser(userId: number, input: UpdateUserInput): Promise<UserDTO> {
    const existing = await this.users.findById(userId);
    if (!existing) {
      throw new UnauthorizedError();
    }
    await this.assertUpdateUnique(userId, input);
    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const updated = await this.users.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image,
    });
    return this.toUserDTO(updated);
  }

  /**
   * Ensure a new registration's email and username are not taken.
   * @param email - Candidate email.
   * @param username - Candidate username.
   * @throws ConflictError if either is taken.
   */
  private async assertUnique(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictError('email has already been taken');
    }
    if (await this.users.findByUsername(username)) {
      throw new ConflictError('username has already been taken');
    }
  }

  /**
   * Ensure an update does not collide with another user's email/username.
   * @param userId - The user being updated.
   * @param input - The update fields.
   * @throws ConflictError if a collision is found.
   */
  private async assertUpdateUnique(userId: number, input: UpdateUserInput): Promise<void> {
    if (input.email) {
      const other = await this.users.findByEmail(input.email);
      if (other && other.id !== userId) {
        throw new ConflictError('email has already been taken');
      }
    }
    if (input.username) {
      const other = await this.users.findByUsername(input.username);
      if (other && other.id !== userId) {
        throw new ConflictError('username has already been taken');
      }
    }
    if (input.email === '' || input.username === '' || input.password === '') {
      throw new ValidationError({ body: ["can't be blank"] });
    }
  }

  /**
   * Map a domain user to the authenticated user DTO, signing a fresh token.
   * @param user - The domain user.
   * @returns The user view.
   */
  private toUserDTO(user: User): UserDTO {
    return {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: signToken(user.id, this.config.jwtSecret, this.config.jwtExpiry),
    };
  }
}
