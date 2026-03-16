import { User } from '@prisma/client';
import { UserRepository } from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(data: RegisterData): Promise<UserResponse> {
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(
      data.username
    );
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      password: hashedPassword
    });

    return this.toUserResponse(user);
  }

  async login(data: LoginData): Promise<UserResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    return this.toUserResponse(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.toUserResponse(user);
  }

  async updateUser(
    userId: string,
    data: UpdateData
  ): Promise<UserResponse> {
    if (data.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new Error('Email already in use');
      }
    }

    if (data.username) {
      const existingUsername = await this.userRepository.findByUsername(
        data.username
      );
      if (existingUsername && existingUsername.id !== userId) {
        throw new Error('Username already taken');
      }
    }

    const updateData = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await this.userRepository.update(userId, updateData);
    return this.toUserResponse(user);
  }

  private toUserResponse(user: User): UserResponse {
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
