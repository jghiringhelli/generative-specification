import { hashPassword, verifyPassword } from "../auth/password";
import { signToken } from "../auth/token";
import { UnauthorizedError, ValidationError } from "../errors/application-error";
import { UserRepositoryPort } from "./user.repository";
import {
  CreateUserData,
  UpdateUserData,
  UserRecord,
  UserResponse
} from "./user.types";

export class UserService {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly jwtSecret: string
  ) {}

  /** Registers a user after enforcing unique credentials. */
  public async register(data: CreateUserData): Promise<UserResponse> {
    await this.ensureCredentialsAvailable(data.email, data.username);
    const password = await hashPassword(data.password);
    return this.toResponse(await this.users.create({ ...data, password }));
  }

  /** Authenticates a user with email and password. */
  public async login(email: string, password: string): Promise<UserResponse> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new ValidationError("Email or password is invalid");
    }
    return this.toResponse(user);
  }

  /** Gets the authenticated user. */
  public async getCurrent(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.toResponse(user);
  }

  /** Updates the authenticated user's editable fields. */
  public async update(userId: number, data: UpdateUserData): Promise<UserResponse> {
    await this.ensureUpdateAvailable(userId, data);
    const password = data.password ? await hashPassword(data.password) : undefined;
    return this.toResponse(await this.users.update(userId, { ...data, password }));
  }

  private async ensureCredentialsAvailable(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ValidationError("Email is already registered");
    }
    if (await this.users.findByUsername(username)) {
      throw new ValidationError("Username is already registered");
    }
  }

  private async ensureUpdateAvailable(userId: number, data: UpdateUserData): Promise<void> {
    const emailOwner = data.email ? await this.users.findByEmail(data.email) : null;
    if (emailOwner && emailOwner.id !== userId) {
      throw new ValidationError("Email is already registered");
    }
    const usernameOwner = data.username
      ? await this.users.findByUsername(data.username)
      : null;
    if (usernameOwner && usernameOwner.id !== userId) {
      throw new ValidationError("Username is already registered");
    }
  }

  private toResponse(user: UserRecord): UserResponse {
    return {
      email: user.email,
      token: signToken(user.id, this.jwtSecret),
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
