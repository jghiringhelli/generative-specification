import { User } from '@prisma/client';
import { UserRepository, UpdateUserData } from './user.repository';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signToken } from '../../utils/token';
import {
  UnauthorizedError,
  ValidationError,
} from '../../utils/errors';
import { RegisterInput, LoginInput, UpdateUserInput } from './user.validation';

/** Serialized user shape returned by the API (RealWorld `user` object). */
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
 * Business logic for user authentication and account management.
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Registers a new user, hashing the password and issuing a token.
   * @param input validated registration data
   * @returns the created user with a fresh token
   * @throws ValidationError when email or username is already taken
   */
  async register(input: RegisterInput): Promise<UserResponse> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError(['email has already been taken']);
    }
    const existingUsername = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new ValidationError(['username has already been taken']);
    }

    const password = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      password,
    });
    return this.toResponse(user);
  }

  /**
   * Authenticates a user by email and password.
   * @param input validated login data
   * @returns the authenticated user with a token
   * @throws UnauthorizedError when credentials are invalid
   */
  async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return this.toResponse(user);
  }

  /**
   * Retrieves the currently authenticated user.
   * @param userId the authenticated user id
   * @returns the user with a token
   * @throws UnauthorizedError when the user no longer exists
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('user not found');
    }
    return this.toResponse(user);
  }

  /**
   * Updates the authenticated user's account.
   * @param userId the authenticated user id
   * @param input validated update fields
   * @returns the updated user with a token
   * @throws ValidationError when a new email/username conflicts
   */
  async updateUser(
    userId: number,
    input: UpdateUserInput,
  ): Promise<UserResponse> {
    if (input.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['email has already been taken']);
      }
    }
    if (input.username) {
      const existing = await this.userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['username has already been taken']);
      }
    }

    const data: UpdateUserData = {
      email: input.email,
      username: input.username,
      bio: input.bio,
      image: input.image,
    };
    if (input.password) {
      data.password = await hashPassword(input.password);
    }

    const user = await this.userRepository.update(userId, data);
    return this.toResponse(user);
  }

  /**
   * Maps a persisted user to the API response shape with a signed token.
   * @param user the persisted user entity
   * @returns the serialized user response
   */
  private toResponse(user: User): UserResponse {
    return {
      user: {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: signToken({ id: user.id, username: user.username }),
      },
    };
  }
}
