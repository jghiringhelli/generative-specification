import pkg, { SignOptions } from 'jsonwebtoken';
const { sign } = pkg;
import * as argon2 from 'argon2';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserResponseDto, UserEntity } from '../types';
import { ValidationError, UnauthorizedError, NotFoundError } from '../errors/AppError';

export interface RegisterInput {
  email?: string;
  username?: string;
  password?: string;
}

export interface LoginInput {
  email?: string;
  password?: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(input: RegisterInput): Promise<UserResponseDto> {
    const errors: Record<string, string[]> = {};

    if (!input.email || !input.email.trim()) {
      errors.email = ["can't be blank"];
    }
    if (!input.username || !input.username.trim()) {
      errors.username = ["can't be blank"];
    }
    if (!input.password || !input.password.trim()) {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const email = input.email!.trim();
    const username = input.username!.trim();
    const password = input.password!;

    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ValidationError({ email: ['has already been taken'] });
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ValidationError({ username: ['has already been taken'] });
    }

    const passwordHash = await argon2.hash(password);
    const user = await this.userRepository.create({
      email,
      username,
      passwordHash,
      bio: '',
      image: ''
    });

    const token = this.generateToken(user);
    return this.mapToResponse(user, token);
  }

  async login(input: LoginInput): Promise<UserResponseDto> {
    const errors: Record<string, string[]> = {};

    if (!input.email || !input.email.trim()) {
      errors.email = ["can't be blank"];
    }
    if (!input.password || !input.password.trim()) {
      errors.password = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const user = await this.userRepository.findByEmail(input.email!.trim());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);
    return this.mapToResponse(user, token);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const token = this.generateToken(user);
    return this.mapToResponse(user, token);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updateData: {
      email?: string;
      username?: string;
      passwordHash?: string;
      bio?: string | null;
      image?: string | null;
    } = {};

    if (input.email !== undefined) {
      const email = input.email.trim();
      if (!email) {
        throw new ValidationError({ email: ["can't be blank"] });
      }
      if (email.toLowerCase() !== existing.email.toLowerCase()) {
        const taken = await this.userRepository.findByEmail(email);
        if (taken) {
          throw new ValidationError({ email: ['has already been taken'] });
        }
      }
      updateData.email = email;
    }

    if (input.username !== undefined) {
      const username = input.username.trim();
      if (!username) {
        throw new ValidationError({ username: ["can't be blank"] });
      }
      if (username !== existing.username) {
        const taken = await this.userRepository.findByUsername(username);
        if (taken) {
          throw new ValidationError({ username: ['has already been taken'] });
        }
      }
      updateData.username = username;
    }

    if (input.password !== undefined) {
      const password = input.password.trim();
      if (!password) {
        throw new ValidationError({ password: ["can't be blank"] });
      }
      updateData.passwordHash = await argon2.hash(password);
    }

    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }

    if (input.image !== undefined) {
      updateData.image = input.image;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);
    const token = this.generateToken(updatedUser);
    return this.mapToResponse(updatedUser, token);
  }

  public generateToken(user: UserEntity): string {
    const secret = process.env.JWT_SECRET || 'secret';
    const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
    return sign({ id: user.id, username: user.username }, secret, {
      expiresIn: JWT_EXPIRY
    });
  }

  private mapToResponse(user: UserEntity, token: string): UserResponseDto {
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio ?? '',
      image: user.image ?? ''
    };
  }
}
