import { Prisma, User } from "@prisma/client";
import { hashPassword, verifyPassword } from "../auth/password";
import { signToken } from "../auth/token";
import { UnauthorizedError, ValidationError } from "../errors";
import { IUserRepository } from "./user.repository";
import { LoginInput, RegisterInput, UpdateUserInput } from "./user.schemas";

export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export class UserService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly jwtSecret: string
  ) {}

  public async register(input: RegisterInput): Promise<UserResponse> {
    if (await this.users.findByEmail(input.email)) {
      throw new ValidationError("Email is already registered");
    }
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      password: await hashPassword(input.password)
    });
    return this.toResponse(user);
  }

  public async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw new ValidationError("Email or password is invalid");
    }
    return this.toResponse(user);
  }

  public async getById(id: number): Promise<UserResponse> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.toResponse(user);
  }

  public async update(id: number, input: UpdateUserInput): Promise<UserResponse> {
    const data: Prisma.UserUpdateInput = { ...input };
    if (input.password) {
      data.password = await hashPassword(input.password);
    }
    return this.toResponse(await this.users.update(id, data));
  }

  private toResponse(user: User): UserResponse {
    return {
      email: user.email,
      token: signToken(user.id, this.jwtSecret),
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
