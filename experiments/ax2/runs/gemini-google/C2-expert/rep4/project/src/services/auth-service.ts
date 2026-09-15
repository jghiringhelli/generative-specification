import { z } from 'zod';
import { IUserRepository } from '../repositories/user-repository.interface';
import { UserRepository } from '../repositories/user-repository';
import { hashPassword, verifyPassword, signToken } from '../utils/security';
import { ValidationError, NotFoundError } from '../errors/http-error';

export const RegisterInputSchema = z.object({
  user: z.object({
    username: z.string().trim().min(1, 'Username is required'),
    email: z.string().trim().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const LoginInputSchema = z.object({
  user: z.object({
    email: z.string().trim().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const UpdateUserInputSchema = z.object({
  user: z.object({
    email: z.string().trim().email('Invalid email format').optional(),
    username: z.string().trim().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export interface UserResponseData {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

/**
 * Service orchestrating authentication and user profile management.
 */
export class AuthService {
  private readonly userRepo: IUserRepository;

  /**
   * Constructs the AuthService.
   *
   * @param {IUserRepository} [userRepository=new UserRepository()] - Injected repository
   */
  constructor(userRepository: IUserRepository = new UserRepository()) {
    this.userRepo = userRepository;
  }

  /**
   * Registers a new user.
   *
   * @param {RegisterInput} input - Validated registration parameters
   * @returns {Promise<UserResponseData>} The created user response with token
   */
  public async register(input: RegisterInput): Promise<UserResponseData> {
    const { email, username, password } = input.user;

    const existingEmail = await this.userRepo.findByEmail(email);
    if (existingEmail) {
      throw new ValidationError('Email is already taken');
    }

    const existingUsername = await this.userRepo.findByUsername(username);
    if (existingUsername) {
      throw new ValidationError('Username is already taken');
    }

    const hashedPassword = await hashPassword(password);
    const user = await this.userRepo.create({
      email,
      username,
      password: hashedPassword,
    });

    const token = signToken({ userId: user.id, email: user.email });
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Authenticates an existing user by email and password.
   *
   * @param {LoginInput} input - Login parameters
   * @returns {Promise<UserResponseData>} The authenticated user response with token
   */
  public async login(input: LoginInput): Promise<UserResponseData> {
    const { email, password } = input.user;

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Retrieves the currently authenticated user's profile.
   *
   * @param {string} userId - User identifier
   * @returns {Promise<UserResponseData>} User response with refreshed token
   */
  public async getCurrentUser(userId: string): Promise<UserResponseData> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const token = signToken({ userId: user.id, email: user.email });
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  /**
   * Updates fields of the currently authenticated user.
   *
   * @param {string} userId - User identifier
   * @param {UpdateUserInput} input - Fields to update
   * @returns {Promise<UserResponseData>} Updated user response
   */
  public async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseData> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { email, username, password, bio, image } = input.user;

    if (email && email !== user.email) {
      const existingEmail = await this.userRepo.findByEmail(email);
      if (existingEmail) {
        throw new ValidationError('Email is already taken');
      }
    }

    if (username && username !== user.username) {
      const existingUsername = await this.userRepo.findByUsername(username);
      if (existingUsername) {
        throw new ValidationError('Username is already taken');
      }
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;

    const updatedUser = await this.userRepo.update(userId, {
      email,
      username,
      password: hashedPassword,
      bio,
      image,
    });

    const token = signToken({ userId: updatedUser.id, email: updatedUser.email });
    return {
      email: updatedUser.email,
      token,
      username: updatedUser.username,
      bio: updatedUser.bio,
      image: updatedUser.image,
    };
  }
}
