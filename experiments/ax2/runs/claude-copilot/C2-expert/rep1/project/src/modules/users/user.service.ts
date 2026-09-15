import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { RegisterInput, LoginInput, UpdateUserInput } from './user.schemas';
import { hashPassword, verifyPassword, signToken } from '../../lib/auth';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../lib/errors';

/** Public user representation returned to clients (RealWorld shape). */
export interface UserResponse {
  user: {
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
    token: string;
  };
}

/**
 * Business logic for authentication and user account management.
 */
export class UserService {
  /**
   * @param userRepository injected persistence port
   * @param jwtSecret secret used to sign tokens
   */
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtSecret: string
  ) {}

  /**
   * Maps a domain user to the RealWorld user envelope with a fresh token.
   * @param user the domain user
   * @returns the user response DTO
   */
  private toResponse(user: User): UserResponse {
    return {
      user: {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: signToken({ id: user.id, username: user.username }, this.jwtSecret)
      }
    };
  }

  /**
   * Registers a new user.
   * @param input validated registration data
   * @returns the created user response
   * @throws ValidationError when email or username is already taken
   */
  async register(input: RegisterInput): Promise<UserResponse> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new ValidationError(['email is already registered']);
    }
    if (await this.userRepository.findByUsername(input.username)) {
      throw new ValidationError(['username is already taken']);
    }
    const password = await hashPassword(input.password);
    const user = await this.userRepository.create({ ...input, password });
    return this.toResponse(user);
  }

  /**
   * Authenticates a user by email and password.
   * @param input validated login data
   * @returns the user response with a token
   * @throws UnauthorizedError when credentials are invalid
   */
  async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return this.toResponse(user);
  }

  /**
   * Returns the currently authenticated user.
   * @param userId the authenticated user id
   * @returns the user response
   * @throws NotFoundError when the user no longer exists
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toResponse(user);
  }

  /**
   * Updates the currently authenticated user.
   * @param userId the authenticated user id
   * @param input validated update fields
   * @returns the updated user response
   * @throws ValidationError when a new email/username collides
   */
  async updateUser(userId: number, input: UpdateUserInput): Promise<UserResponse> {
    if (input.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['email is already registered']);
      }
    }
    if (input.username) {
      const existing = await this.userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['username is already taken']);
      }
    }
    const data = { ...input };
    if (input.password) {
      data.password = await hashPassword(input.password);
    }
    const user = await this.userRepository.update(userId, data);
    return this.toResponse(user);
  }
}
