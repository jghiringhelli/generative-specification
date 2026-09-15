import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/token';
import { UserNotFoundError, UserValidationError } from './user.errors';
import { UserRepositoryPort } from './user.repository';
import { UpdateUserData, UserRecord, UserResponse } from './user.types';

export class UserService {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly jwtSecret: string,
  ) {}

  /** Registers a new user. */
  public async register(email: string, username: string, password: string): Promise<UserResponse> {
    if (await this.users.findByEmail(email)) {
      throw new UserValidationError('email has already been taken');
    }

    const passwordHash = await hashPassword(password);
    const user = await this.users.create({ email, username, password: passwordHash });
    return this.toResponse(user);
  }

  /** Authenticates an existing user. */
  public async login(email: string, password: string): Promise<UserResponse> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UserValidationError('email or password is invalid');
    }
    return this.toResponse(user);
  }

  /** Gets the currently authenticated user. */
  public async getCurrent(userId: number): Promise<UserResponse> {
    return this.toResponse(await this.requireUser(userId));
  }

  /** Updates the currently authenticated user. */
  public async update(userId: number, changes: UpdateUserData): Promise<UserResponse> {
    await this.requireUser(userId);
    const password = changes.password ? await hashPassword(changes.password) : undefined;
    const user = await this.users.update(userId, { ...changes, password });
    return this.toResponse(user);
  }

  private async requireUser(userId: number): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }

  private toResponse(user: UserRecord): UserResponse {
    return {
      email: user.email,
      token: signToken(user.id, this.jwtSecret),
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
