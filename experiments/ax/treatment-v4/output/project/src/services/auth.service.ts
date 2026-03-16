import argon2 from 'argon2';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { ValidationError, AuthenticationError } from '../errors/AppError';
import { signToken } from '../utils/jwt';

// Constants per CLAUDE.md requirement (no magic numbers)
const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536; // 64 MiB
const ARGON2_PARALLELISM = 4;

export interface RegisterUserDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * Authentication service.
 * Handles user registration, login, and profile updates.
 * All password operations use argon2 per approved-packages.md.
 */
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @param dto - Registration data (email, username, password)
   * @returns User with JWT token
   * @throws ValidationError if email or username already exists
   */
  async register(dto: RegisterUserDto): Promise<UserResponse> {
    // Check email uniqueness
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ValidationError('Email already taken');
    }

    // Check username uniqueness
    const existingUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new ValidationError('Username already taken');
    }

    // Hash password with argon2
    const passwordHash = await argon2.hash(dto.password, {
      timeCost: ARGON2_TIME_COST,
      memoryCost: ARGON2_MEMORY_COST,
      parallelism: ARGON2_PARALLELISM
    });

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash
    });

    return this.toUserResponse(user);
  }

  /**
   * Authenticate user with email and password.
   * @param dto - Login credentials
   * @returns User with JWT token
   * @throws ValidationError if credentials are invalid
   */
  async login(dto: LoginUserDto): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    
    if (!user) {
      throw new ValidationError('Email or password is invalid');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new ValidationError('Email or password is invalid');
    }

    return this.toUserResponse(user);
  }

  /**
   * Get current user by ID.
   * @param userId - User ID from JWT
   * @returns User with fresh token
   * @throws AuthenticationError if user not found
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return this.toUserResponse(user);
  }

  /**
   * Update user profile.
   * @param userId - User ID from JWT
   * @param dto - Update data (partial fields)
   * @returns Updated user with fresh token
   * @throws ValidationError if email/username conflict
   */
  async updateUser(userId: number, dto: UpdateUserDto): Promise<UserResponse> {
    // Check email uniqueness if changing
    if (dto.email) {
      const existingEmail = await this.userRepository.findByEmail(dto.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ValidationError('Email already taken');
      }
    }

    // Check username uniqueness if changing
    if (dto.username) {
      const existingUsername = await this.userRepository.findByUsername(dto.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ValidationError('Username already taken');
      }
    }

    // Hash new password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await argon2.hash(dto.password, {
        timeCost: ARGON2_TIME_COST,
        memoryCost: ARGON2_MEMORY_COST,
        parallelism: ARGON2_PARALLELISM
      });
    }

    const user = await this.userRepository.update(userId, {
      email: dto.email,
      username: dto.username,
      passwordHash,
      bio: dto.bio,
      image: dto.image
    });

    return this.toUserResponse(user);
  }

  /**
   * Map UserEntity to API response format with JWT token.
   */
  private toUserResponse(user: UserEntity): UserResponse {
    const token = signToken(user.id);
    
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
