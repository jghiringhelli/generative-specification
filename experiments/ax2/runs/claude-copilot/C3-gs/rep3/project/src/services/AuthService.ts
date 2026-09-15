import { IUserRepository } from '../repositories/IUserRepository';
import { RegisterInput, LoginInput, UpdateUserRequest } from '../validators/userSchemas';
import { UserResponse } from '../types/responses';
import { User } from '../types/domain';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/token';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError';
import { AppConfig } from '../config/config';

/** Orchestrates registration, login, and current-user operations. */
export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly config: AppConfig,
  ) {}

  private toResponse(user: User): UserResponse {
    const token = generateToken(
      { id: user.id, username: user.username },
      this.config.jwtSecret,
      this.config.jwtExpiry,
    );
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  async register(input: RegisterInput): Promise<UserResponse> {
    const { email, username, password } = input.user;
    const errors: Record<string, string[]> = {};
    if (await this.users.findByEmail(email)) {
      errors.email = ['has already been taken'];
    }
    if (await this.users.findByUsername(username)) {
      errors.username = ['has already been taken'];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
    const passwordHash = await hashPassword(password);
    const user = await this.users.create({ email, username, passwordHash });
    return this.toResponse(user);
  }

  async login(input: LoginInput): Promise<UserResponse> {
    const { email, password } = input.user;
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return this.toResponse(user);
  }

  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.toResponse(user);
  }

  async updateUser(
    userId: number,
    input: UpdateUserRequest,
  ): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    const { email, username, password, bio, image } = input.user;
    const errors: Record<string, string[]> = {};
    if (email && email !== user.email && (await this.users.findByEmail(email))) {
      errors.email = ['has already been taken'];
    }
    if (
      username &&
      username !== user.username &&
      (await this.users.findByUsername(username))
    ) {
      errors.username = ['has already been taken'];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
    const updated = await this.users.update(userId, {
      email,
      username,
      bio,
      image,
      passwordHash: password ? await hashPassword(password) : undefined,
    });
    return this.toResponse(updated);
  }
}
