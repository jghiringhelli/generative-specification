import {
  IUserRepository,
  UpdateUserData,
  UserRecord,
} from '../repositories/IUserRepository';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError';
import {
  LoginUserCommand,
  RegisterUserCommand,
  UpdateUserCommand,
  UserResponse,
} from './contracts';
import { PasswordHasher, TokenService } from './ports';

export class AuthService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  /** Registers a user and returns an authenticated representation. */
  public async register(command: RegisterUserCommand): Promise<UserResponse> {
    await this.ensureIdentityAvailable(command.email, command.username);
    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = await this.users.create({
      email: command.email,
      username: command.username,
      passwordHash,
    });
    return this.toResponse(user);
  }

  /** Authenticates an existing user. */
  public async login(command: LoginUserCommand): Promise<UserResponse> {
    const user = await this.users.findByEmail(command.email);
    if (!user || !(await this.passwordHasher.verify(user.passwordHash, command.password))) {
      throw new ValidationError('Email or password is invalid');
    }
    return this.toResponse(user);
  }

  /** Returns the authenticated user. */
  public async getCurrentUser(userId: string): Promise<UserResponse> {
    return this.toResponse(await this.requireUser(userId));
  }

  /** Updates the authenticated user. */
  public async updateUser(userId: string, command: UpdateUserCommand): Promise<UserResponse> {
    const current = await this.requireUser(userId);
    await this.ensureUpdateAvailable(current, command);
    const data = await this.toUpdateData(command);
    return this.toResponse(await this.users.update(userId, data));
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found', { userId });
    }
    return user;
  }

  private async ensureIdentityAvailable(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ValidationError('Email has already been taken');
    }
    if (await this.users.findByUsername(username)) {
      throw new ValidationError('Username has already been taken');
    }
  }

  private async ensureUpdateAvailable(
    current: UserRecord,
    command: UpdateUserCommand,
  ): Promise<void> {
    if (command.email && command.email !== current.email && await this.users.findByEmail(command.email)) {
      throw new ValidationError('Email has already been taken');
    }
    if (command.username && command.username !== current.username
      && await this.users.findByUsername(command.username)) {
      throw new ValidationError('Username has already been taken');
    }
  }

  private async toUpdateData(command: UpdateUserCommand): Promise<UpdateUserData> {
    const passwordHash = command.password
      ? await this.passwordHasher.hash(command.password)
      : undefined;
    return {
      email: command.email,
      username: command.username,
      passwordHash,
      bio: command.bio,
      image: command.image,
    };
  }

  private toResponse(user: UserRecord): UserResponse {
    if (!user.id) {
      throw new UnauthorizedError('User identity is invalid');
    }
    return {
      email: user.email,
      token: this.tokens.sign(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
