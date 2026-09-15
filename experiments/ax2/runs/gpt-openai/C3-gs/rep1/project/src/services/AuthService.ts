import { NotFoundError, UnauthorizedError, ValidationError } from '../errors/AppError';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService } from '../auth/ITokenService';
import type { IUserRepository, UserRecord } from '../repositories/IUserRepository';

export interface RegisterInput {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserInput {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export class AuthService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /** Registers a new user and returns the authenticated representation. */
  public async register(input: RegisterInput): Promise<UserResponse> {
    await this.ensureUnique(input.email, input.username);
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.toResponse(user);
  }

  /** Authenticates an existing user with email and password. */
  public async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await this.passwordHasher.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.toResponse(user);
  }

  /** Retrieves the authenticated user's current representation. */
  public async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.requireUser(userId);
    return this.toResponse(user);
  }

  /** Updates the authenticated user and returns the resulting representation. */
  public async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    const current = await this.requireUser(userId);
    await this.ensureAvailableForUpdate(current, input);
    const passwordHash = input.password
      ? await this.passwordHasher.hash(input.password)
      : undefined;
    const user = await this.users.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image,
    });
    return this.toResponse(user);
  }

  private async ensureUnique(email: string, username: string): Promise<void> {
    const [emailUser, usernameUser] = await Promise.all([
      this.users.findByEmail(email),
      this.users.findByUsername(username),
    ]);
    if (emailUser || usernameUser) {
      throw new ValidationError('Email or username is already in use');
    }
  }

  private async ensureAvailableForUpdate(
    current: UserRecord,
    input: UpdateUserInput,
  ): Promise<void> {
    const emailUser = input.email ? await this.users.findByEmail(input.email) : null;
    const usernameUser = input.username ? await this.users.findByUsername(input.username) : null;
    if (emailUser && emailUser.id !== current.id) throw new ValidationError('Email is already in use');
    if (usernameUser && usernameUser.id !== current.id) {
      throw new ValidationError('Username is already in use');
    }
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found', { userId });
    return user;
  }

  private toResponse(user: UserRecord): UserResponse {
    return {
      email: user.email,
      token: this.tokens.sign({ userId: user.id }),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
