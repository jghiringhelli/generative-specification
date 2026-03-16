import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/IUserRepository';
import { env } from '../config/env';
import { ARGON2_TIME_COST, ARGON2_MEMORY_COST, ARGON2_PARALLELISM, JWT_EXPIRY } from '../config/constants';
import { ValidationError, AuthenticationError, NotFoundError } from '../errors/AppError';

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * User service - business logic for authentication and user management.
 * Depends on IUserRepository interface only (injected).
 */
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user.
   * @throws ValidationError if email or username already taken
   */
  async register(dto: RegisterDTO): Promise<UserResponse> {
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

    // Hash password with Argon2
    const passwordHash = await argon2.hash(dto.password, {
      timeCost: ARGON2_TIME_COST,
      memoryCost: ARGON2_MEMORY_COST,
      parallelism: ARGON2_PARALLELISM,
      type: argon2.argon2id
    });

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash
    });

    // Generate JWT
    const token = this.generateToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Authenticate user with email and password.
   * @throws AuthenticationError if credentials invalid
   */
  async login(dto: LoginDTO): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password with Argon2
    const isValid = await argon2.verify(user.passwordHash, dto.password);
    
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = this.generateToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Get current user by ID.
   * @throws NotFoundError if user not found
   */
  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    const token = this.generateToken(user.id);

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Update user profile.
   * @throws NotFoundError if user not found
   * @throws ValidationError if email/username conflict
   */
  async updateUser(userId: number, dto: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(dto.email);
      if (existingEmail) {
        throw new ValidationError('Email already taken');
      }
    }

    // Check username uniqueness if changing
    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(dto.username);
      if (existingUsername) {
        throw new ValidationError('Username already taken');
      }
    }

    // Hash password if changing
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await argon2.hash(dto.password, {
        timeCost: ARGON2_TIME_COST,
        memoryCost: ARGON2_MEMORY_COST,
        parallelism: ARGON2_PARALLELISM,
        type: argon2.argon2id
      });
    }

    const updated = await this.userRepository.update(userId, {
      ...dto,
      passwordHash
    });

    const token = this.generateToken(updated.id);

    return {
      email: updated.email,
      token,
      username: updated.username,
      bio: updated.bio,
      image: updated.image
    };
  }

  /**
   * Generate JWT token for user.
   */
  private generateToken(userId: number): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }
}
