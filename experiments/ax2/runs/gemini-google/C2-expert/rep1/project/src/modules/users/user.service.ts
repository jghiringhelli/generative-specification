import { User } from '@prisma/client';
import { IUserRepository, UserRepository } from './user.repository';
import { RegisterUserInput, LoginUserInput, UpdateUserInput, UserResponseData } from './user.dto';
import { hashPassword, verifyPassword, signToken } from './auth.utils';
import { ConflictError, NotFoundError, ValidationError } from '../../errors/app-error';

export class UserService {
  constructor(private readonly userRepository: IUserRepository = new UserRepository()) {}

  async register(input: RegisterUserInput): Promise<UserResponseData> {
    const { email, username, password } = input.user;

    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictError('email has already been taken');
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError('username has already been taken');
    }

    const hashedPassword = await hashPassword(password);
    const user = await this.userRepository.create({
      email,
      username,
      password: hashedPassword
    });

    return this.buildUserResponse(user);
  }

  async login(input: LoginUserInput): Promise<UserResponseData> {
    const { email, password } = input.user;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new ValidationError('email or password is invalid');
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      throw new ValidationError('email or password is invalid');
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponseData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.buildUserResponse(user);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseData> {
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    const { email, username, password, bio, image } = input.user;

    if (email && email !== currentUser.email) {
      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail) {
        throw new ConflictError('email has already been taken');
      }
    }

    if (username && username !== currentUser.username) {
      const existingUsername = await this.userRepository.findByUsername(username);
      if (existingUsername) {
        throw new ConflictError('username has already been taken');
      }
    }

    const updatePayload: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string | null;
      image?: string | null;
    } = {};

    if (email !== undefined) updatePayload.email = email;
    if (username !== undefined) updatePayload.username = username;
    if (bio !== undefined) updatePayload.bio = bio;
    if (image !== undefined) updatePayload.image = image;
    if (password) {
      updatePayload.password = await hashPassword(password);
    }

    const updatedUser = await this.userRepository.update(userId, updatePayload);
    return this.buildUserResponse(updatedUser);
  }

  private buildUserResponse(user: User): UserResponseData {
    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
