import type { User } from '@prisma/client';
import { ApplicationError } from '../errors/application-error';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/token';
import type { LoginInput, RegisterInput, UpdateUserInput } from './schemas';
import { UserRepository, type UserUpdate } from './repository';

export interface UserResponse {
  readonly user: {
    readonly email: string;
    readonly token: string;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
  };
}

export class UserService {
  public constructor(private readonly users: UserRepository) {}

  /** Registers a new user. */
  public async register(input: RegisterInput): Promise<UserResponse> {
    if (await this.users.findByEmail(input.email)) {
      throw new ApplicationError('Email is already registered', 422);
    }
    if (await this.users.findByUsername(input.username)) {
      throw new ApplicationError('Username is already registered', 422);
    }
    const user = await this.users.create({ ...input, password: await hashPassword(input.password) });
    return this.toResponse(user);
  }

  /** Authenticates a user. */
  public async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw new ApplicationError('Email or password is invalid', 422);
    }
    return this.toResponse(user);
  }

  /** Gets the authenticated user. */
  public async getCurrent(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new ApplicationError('User not found', 401);
    return this.toResponse(user);
  }

  /** Updates the authenticated user. */
  public async update(userId: number, input: UpdateUserInput): Promise<UserResponse> {
    const data: UserUpdate = { ...input };
    if (input.password) data.password = await hashPassword(input.password);
    const user = await this.users.update(userId, data);
    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponse {
    return { user: {
      email: user.email,
      token: signToken(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    } };
  }
}
