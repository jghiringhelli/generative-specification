import { User } from "@prisma/client";
import { hashPassword, signToken, verifyPassword } from "../../lib/auth";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../lib/errors";
import {
  LoginInput,
  RegisterInput,
  UpdateUserInput,
} from "./user.schemas";
import { UserRepository } from "./user.repository";

/** The `user` object returned by auth endpoints. */
export interface UserResponse {
  user: {
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
    token: string;
  };
}

/**
 * Business logic for authentication and the current-user resource.
 */
export class UserService {
  private readonly users: UserRepository;

  /**
   * @param users Injected user repository.
   */
  constructor(users: UserRepository) {
    this.users = users;
  }

  /**
   * Register a new user.
   * @param input Validated registration input.
   * @returns The created user with a fresh token.
   */
  async register(input: RegisterInput): Promise<UserResponse> {
    const errors: string[] = [];
    if (await this.users.findByEmail(input.email)) {
      errors.push("email has already been taken");
    }
    if (await this.users.findByUsername(input.username)) {
      errors.push("username has already been taken");
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    const password = await hashPassword(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      password,
    });
    return this.toResponse(user);
  }

  /**
   * Authenticate a user by email and password.
   * @param input Validated login input.
   * @returns The authenticated user with a fresh token.
   */
  async login(input: LoginInput): Promise<UserResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("email or password is invalid");
    }
    const matches = await verifyPassword(input.password, user.password);
    if (!matches) {
      throw new ValidationError(["email or password is invalid"]);
    }
    return this.toResponse(user);
  }

  /**
   * Fetch the currently authenticated user.
   * @param id The authenticated user id.
   * @returns The current user with a fresh token.
   */
  async getCurrent(id: number): Promise<UserResponse> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError("user not found");
    }
    return this.toResponse(user);
  }

  /**
   * Update the currently authenticated user.
   * @param id The authenticated user id.
   * @param input Validated update input.
   * @returns The updated user with a fresh token.
   */
  async update(id: number, input: UpdateUserInput): Promise<UserResponse> {
    const current = await this.users.findById(id);
    if (!current) {
      throw new NotFoundError("user not found");
    }
    const errors: string[] = [];
    if (input.email && input.email !== current.email) {
      const existing = await this.users.findByEmail(input.email);
      if (existing && existing.id !== id) {
        errors.push("email has already been taken");
      }
    }
    if (input.username && input.username !== current.username) {
      const existing = await this.users.findByUsername(input.username);
      if (existing && existing.id !== id) {
        errors.push("username has already been taken");
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    const data: Record<string, unknown> = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.username !== undefined) data.username = input.username;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.image !== undefined) data.image = input.image;
    if (input.password !== undefined) {
      data.password = await hashPassword(input.password);
    }
    const user = await this.users.update(id, data);
    return this.toResponse(user);
  }

  /**
   * Map a persisted user to the auth response shape (with token).
   * @param user The persisted user.
   * @returns The user response.
   */
  private toResponse(user: User): UserResponse {
    return {
      user: {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: signToken({ id: user.id, username: user.username }),
      },
    };
  }
}
