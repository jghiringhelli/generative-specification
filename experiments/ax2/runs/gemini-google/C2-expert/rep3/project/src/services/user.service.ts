import { NotFoundError, ValidationError } from '../errors/app-error';
import { UserRepository } from '../repositories/user.repository';
import { UserResponseDto } from '../types/auth.types';
import { signToken } from '../utils/jwt.util';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { LoginUserInput, RegisterUserInput, UpdateUserInput } from '../validators/user.validator';

/**
 * Service orchestrating user authentication and profile management.
 */
export class UserService {
  private readonly userRepository: UserRepository;

  /**
   * Initializes UserService.
   *
   * @param {UserRepository} [userRepository] Repository instance
   */
  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Registers a new user.
   *
   * @param {RegisterUserInput} input Registration data
   * @returns {Promise<UserResponseDto>} Registered user with auth token
   */
  async register(input: RegisterUserInput): Promise<UserResponseDto> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ValidationError('email has already been taken');
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ValidationError('username has already been taken');
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepository.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Authenticates an existing user.
   *
   * @param {LoginUserInput} input Login credentials
   * @returns {Promise<UserResponseDto>} Authenticated user with auth token
   */
  async login(input: LoginUserInput): Promise<UserResponseDto> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError('invalid email or password');
    }

    const isValid = await verifyPassword(input.password, user.password);
    if (!isValid) {
      throw new ValidationError('invalid email or password');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Retrieves the current user by ID.
   *
   * @param {number} userId User identifier
   * @param {string} [token] Current token to include in response
   * @returns {Promise<UserResponseDto>} Current user profile
   */
  async getCurrentUser(userId: number, token?: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const activeToken = token || signToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      email: user.email,
      token: activeToken,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Updates an existing user's credentials or profile.
   *
   * @param {number} userId User identifier
   * @param {UpdateUserInput} input Fields to update
   * @param {string} [token] Current token
   * @returns {Promise<UserResponseDto>} Updated user profile
   */
  async updateUser(userId: number, input: UpdateUserInput, token?: string): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== existing.email) {
      const taken = await this.userRepository.findByEmail(input.email);
      if (taken) {
        throw new ValidationError('email has already been taken');
      }
    }

    if (input.username && input.username !== existing.username) {
      const taken = await this.userRepository.findByUsername(input.username);
      if (taken) {
        throw new ValidationError('username has already been taken');
      }
    }

    let hashedPassword: string | undefined;
    if (input.password) {
      hashedPassword = await hashPassword(input.password);
    }

    const updated = await this.userRepository.update(userId, {
      email: input.email,
      username: input.username,
      password: hashedPassword,
      bio: input.bio,
      image: input.image,
    });

    const activeToken = token || signToken({
      id: updated.id,
      email: updated.email,
      username: updated.username,
    });

    return {
      email: updated.email,
      token: activeToken,
      username: updated.username,
      bio: updated.bio,
      image: updated.image,
    };
  }
}
