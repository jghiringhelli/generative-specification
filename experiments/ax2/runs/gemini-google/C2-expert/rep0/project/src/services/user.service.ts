import { IUserRepository, UserRepository } from '../repositories/user.repository';
import {
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput,
  UserResponse,
  UserEntity
} from '../types/user.types';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { signToken } from '../utils/jwt.util';
import { ValidationError, NotFoundError } from '../utils/error.util';

export interface IUserService {
  register(input: RegisterUserInput): Promise<UserResponse>;
  login(input: LoginUserInput): Promise<UserResponse>;
  getCurrentUser(userId: number, existingToken?: string): Promise<UserResponse>;
  updateUser(userId: number, input: UpdateUserInput, existingToken?: string): Promise<UserResponse>;
}

export class UserService implements IUserService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Registers a new user account.
   *
   * @param {RegisterUserInput} input - User registration payload
   * @returns {Promise<UserResponse>} Registered user with authentication token
   */
  public async register(input: RegisterUserInput): Promise<UserResponse> {
    const existingByEmail = await this.userRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new ValidationError('Email is already registered');
    }

    const existingByUsername = await this.userRepository.findByUsername(input.username);
    if (existingByUsername) {
      throw new ValidationError('Username is already taken');
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      password: hashedPassword
    });

    const token = signToken({ id: user.id, username: user.username, email: user.email });
    return this.buildUserResponse(user, token);
  }

  /**
   * Authenticates a user by email and password.
   *
   * @param {LoginUserInput} input - User login credentials
   * @returns {Promise<UserResponse>} Authenticated user with token
   */
  public async login(input: LoginUserInput): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid email or password');
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });
    return this.buildUserResponse(user, token);
  }

  /**
   * Retrieves the current authenticated user's details.
   *
   * @param {number} userId - Authenticated user identifier
   * @param {string} [existingToken] - Current JWT token if available
   * @returns {Promise<UserResponse>} User profile details
   */
  public async getCurrentUser(userId: number, existingToken?: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const token = existingToken || signToken({ id: user.id, username: user.username, email: user.email });
    return this.buildUserResponse(user, token);
  }

  /**
   * Updates user profile fields.
   *
   * @param {number} userId - Authenticated user identifier
   * @param {UpdateUserInput} input - Partial user update data
   * @param {string} [existingToken] - Current JWT token if available
   * @returns {Promise<UserResponse>} Updated user profile details
   */
  public async updateUser(
    userId: number,
    input: UpdateUserInput,
    existingToken?: string
  ): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ValidationError('Email is already registered');
      }
    }

    if (input.username && input.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(input.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ValidationError('Username is already taken');
      }
    }

    const updateData: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string | null;
      image?: string | null;
    } = {
      ...(input.email ? { email: input.email } : {}),
      ...(input.username ? { username: input.username } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.image !== undefined ? { image: input.image } : {})
    };

    if (input.password) {
      updateData.password = await hashPassword(input.password);
    }

    const updatedUser = await this.userRepository.update(userId, updateData);
    const token = existingToken || signToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email
    });

    return this.buildUserResponse(updatedUser, token);
  }

  private buildUserResponse(user: UserEntity, token: string): UserResponse {
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image
      }
    };
  }
}
