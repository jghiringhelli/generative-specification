import { AuthenticationError, ValidationError } from "../errors";
import { hashPassword, verifyPassword } from "../auth/password";
import { signToken } from "../auth/token";
import { UserRepositoryPort } from "./user.repository";
import { LoginRequest, RegisterRequest, UpdateUserRequest } from "./user.schemas";
import { UserRecord, UserResponse } from "./user.types";

export class UserService {
  public constructor(
    private readonly users: UserRepositoryPort,
    private readonly jwtSecret: string
  ) {}

  /** Registers and returns an authenticated user. */
  public async register(request: RegisterRequest): Promise<UserResponse> {
    if (await this.users.findByEmail(request.email)) {
      throw new ValidationError("email has already been taken");
    }
    const password = await hashPassword(request.password);
    const user = await this.users.create({ ...request, password });
    return this.toResponse(user);
  }

  /** Authenticates a user with email and password. */
  public async login(request: LoginRequest): Promise<UserResponse> {
    const user = await this.users.findByEmail(request.email);
    if (!user || !(await verifyPassword(request.password, user.password))) {
      throw new ValidationError("email or password is invalid");
    }
    return this.toResponse(user);
  }

  /** Returns the current authenticated user. */
  public async getCurrent(userId: number): Promise<UserResponse> {
    return this.toResponse(await this.requireUser(userId));
  }

  /** Updates and returns the current authenticated user. */
  public async update(userId: number, request: UpdateUserRequest): Promise<UserResponse> {
    const data = { ...request };
    if (request.password) {
      data.password = await hashPassword(request.password);
    }
    return this.toResponse(await this.users.update(userId, data));
  }

  private async requireUser(userId: number): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AuthenticationError();
    }
    return user;
  }

  private toResponse(user: UserRecord): UserResponse {
    return {
      email: user.email,
      token: signToken({ userId: user.id }, this.jwtSecret),
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
