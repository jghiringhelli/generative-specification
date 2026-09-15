import pkg from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import {
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput,
} from '../validators/auth.validator';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError';
import { config } from '../config/env';

const { sign } = pkg;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

export interface UserResponseDTO {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export class AuthService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  generateToken(user: TokenPayload): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    return sign(payload, config.jwtSecret, {
      expiresIn: JWT_EXPIRY,
    });
  }

  private toUserResponseDTO(user: UserEntity, token?: string): UserResponseDTO {
    const activeToken =
      token ??
      this.generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

    return {
      email: user.email,
      token: activeToken,
      username: user.username,
      bio: user.bio ?? '',
      image: user.image ?? '',
    };
  }

  async register(input: RegisterUserInput): Promise<UserResponseDTO> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered', {
        email: ['has already been taken'],
      });
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError('Username already taken', {
        username: ['has already been taken'],
      });
    }

    const passwordHash = await this.hashPassword(input.password);

    const created = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });

    return this.toUserResponseDTO(created);
  }

  async login(input: LoginUserInput): Promise<UserResponseDTO> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await this.verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.toUserResponseDTO(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.toUserResponseDTO(user);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Email already registered', {
          email: ['has already been taken'],
        });
      }
    }

    if (input.username && input.username !== user.username) {
      const existing = await this.userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username already taken', {
          username: ['has already been taken'],
        });
      }
    }

    let passwordHash: string | undefined = undefined;
    if (input.password) {
      passwordHash = await this.hashPassword(input.password);
    }

    const updated = await this.userRepository.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image,
    });

    return this.toUserResponseDTO(updated);
  }
}
