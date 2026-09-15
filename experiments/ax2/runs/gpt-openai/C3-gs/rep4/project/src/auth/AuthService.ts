import type { User } from '@prisma/client';
import {
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError';
import type {
  IUserRepository,
  UpdateUserData,
} from '../repositories/IUserRepository';
import type { IPasswordHasher } from './PasswordHasher';
import type { ITokenService } from './JwtTokenService';

export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface RegisterInput {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface UpdateCurrentUserInput {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export class AuthService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly passwords: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /** Registers a new account and returns its authenticated representation. */
  public async register(input: RegisterInput): Promise<UserResponse> {
    await this.assertUniqueIdentity(input.email, input.username);
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.toResponse(user);
  }

  /** Authenticates credentials and returns the current user. */
  public async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await this.passwords.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.toResponse(user);
  }

  /** Gets the current authenticated user. */
  public async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.requireUser(userId);
    return this.toResponse(user);
  }

  /** Updates fields on the current authenticated user. */
  public async updateCurrentUser(
    userId: string,
    input: UpdateCurrentUserInput,
  ): Promise<UserResponse> {
    const current = await this.requireUser(userId);
    await this.assertUpdateIdentity(current, input);
    const data = await this.buildUpdateData(input);
    const user = await this.users.update(userId, data);
    return this.toResponse(user);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }

  private async assertUniqueIdentity(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictError('Email is already registered');
    }
    if (await this.users.findByUsername(username)) {
      throw new ConflictError('Username is already registered');
    }
  }

  private async assertUpdateIdentity(
    current: User,
    input: UpdateCurrentUserInput,
  ): Promise<void> {
    if (input.email && input.email !== current.email && await this.users.findByEmail(input.email)) {
      throw new ConflictError('Email is already registered');
    }
    if (input.username && input.username !== current.username
      && await this.users.findByUsername(input.username)) {
      throw new ConflictError('Username is already registered');
    }
  }

  private async buildUpdateData(input: UpdateCurrentUserInput): Promise<UpdateUserData> {
    const passwordHash = input.password
      ? await this.passwords.hash(input.password)
      : undefined;
    const { password: _password, ...fields } = input;
    return { ...fields, passwordHash };
  }

  private toResponse(user: User): UserResponse {
    return {
      email: user.email,
      token: this.tokens.create(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
