import { IUserRepository } from '../repositories/IUserRepository';
import { IPasswordHasher } from './ports/IPasswordHasher';
import { ITokenService } from './ports/ITokenService';
import { toUserResponse, UserResponse } from '../dto/views';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../errors/AppError';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * Business logic for authentication and the current-user resource. Depends only
 * on ports: a user repository, a password hasher, and a token service.
 */
export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwords: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /** Register a new user, enforcing unique email and username. */
  async register(input: RegisterInput): Promise<UserResponse> {
    const existingEmail = await this.users.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('email has already been taken', {
        email: ['has already been taken'],
      });
    }
    const existingUsername = await this.users.findByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError('username has already been taken', {
        username: ['has already been taken'],
      });
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return toUserResponse(user, this.tokens.sign(user.id));
  }

  /** Authenticate by email and password, returning a signed token. */
  async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid', {
        'email or password': ['is invalid'],
      });
    }
    const valid = await this.passwords.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedError('email or password is invalid', {
        'email or password': ['is invalid'],
      });
    }
    return toUserResponse(user, this.tokens.sign(user.id));
  }

  /** Return the current user resource with a fresh token. */
  async getCurrentUser(userId: string, token: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('user not found');
    }
    return toUserResponse(user, token);
  }

  /** Update mutable fields of the current user, enforcing uniqueness. */
  async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('user not found');
    }

    await this.assertUniqueEmail(input.email, user.email);
    await this.assertUniqueUsername(input.username, user.username);

    const passwordHash = input.password
      ? await this.passwords.hash(input.password)
      : undefined;

    const updated = await this.users.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image,
    });
    return toUserResponse(updated, this.tokens.sign(updated.id));
  }

  private async assertUniqueEmail(email: string | undefined, current: string): Promise<void> {
    if (!email || email === current) {
      return;
    }
    const clash = await this.users.findByEmail(email);
    if (clash) {
      throw new ValidationError('email has already been taken', {
        email: ['has already been taken'],
      });
    }
  }

  private async assertUniqueUsername(
    username: string | undefined,
    current: string,
  ): Promise<void> {
    if (!username || username === current) {
      return;
    }
    const clash = await this.users.findByUsername(username);
    if (clash) {
      throw new ValidationError('username has already been taken', {
        username: ['has already been taken'],
      });
    }
  }
}
