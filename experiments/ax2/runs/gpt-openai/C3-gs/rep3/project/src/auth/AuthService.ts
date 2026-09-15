import {
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError';
import {
  IUserRepository,
  UpdateUserRecord,
  UserRecord,
} from '../repositories/IUserRepository';
import { IPasswordHasher } from './IPasswordHasher';
import { ITokenService } from './ITokenService';

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

export interface AuthenticatedUser {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export class AuthService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly passwords: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /** Registers a user and returns its authenticated representation. */
  public async register(input: RegisterInput): Promise<AuthenticatedUser> {
    await this.assertAvailable(input.email, input.username);
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.toAuthenticatedUser(user);
  }

  /** Authenticates an email and password. */
  public async login(input: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await this.passwords.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.toAuthenticatedUser(user);
  }

  /** Gets the authenticated user by identifier. */
  public async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.requireUser(userId);
    return this.toAuthenticatedUser(user);
  }

  /** Updates fields belonging to the authenticated user. */
  public async updateUser(
    userId: string,
    input: UpdateUserInput,
  ): Promise<AuthenticatedUser> {
    const current = await this.requireUser(userId);
    await this.assertUpdateAvailable(current, input);
    const update = await this.buildUpdate(input);
    const user = await this.users.update(userId, update);
    return this.toAuthenticatedUser(user);
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Authenticated user no longer exists');
    }
    return user;
  }

  private async assertAvailable(email: string, username: string): Promise<void> {
    const [emailOwner, usernameOwner] = await Promise.all([
      this.users.findByEmail(email),
      this.users.findByUsername(username),
    ]);
    if (emailOwner) throw new ConflictError('Email is already in use');
    if (usernameOwner) throw new ConflictError('Username is already in use');
  }

  private async assertUpdateAvailable(
    current: UserRecord,
    input: UpdateUserInput,
  ): Promise<void> {
    if (input.email && input.email !== current.email) {
      if (await this.users.findByEmail(input.email)) {
        throw new ConflictError('Email is already in use');
      }
    }
    if (input.username && input.username !== current.username) {
      if (await this.users.findByUsername(input.username)) {
        throw new ConflictError('Username is already in use');
      }
    }
  }

  private async buildUpdate(input: UpdateUserInput): Promise<UpdateUserRecord> {
    const { password, ...fields } = input;
    if (!password) return fields;
    return { ...fields, passwordHash: await this.passwords.hash(password) };
  }

  private toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    return {
      email: user.email,
      token: this.tokens.sign(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
