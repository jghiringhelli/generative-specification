import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { RegisterInput, LoginInput, UpdateUserInput } from '../validators/user.schemas';

/**
 * Application service for authentication and current-user management.
 * Depends on the UserRepository abstraction, never on Prisma directly.
 */
export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /**
   * Registers a new user after enforcing unique email/username.
   * @param input validated registration fields.
   * @returns the created user entity.
   */
  async register(input: RegisterInput): Promise<User> {
    if (await this.users.findByEmail(input.email)) {
      throw new ValidationError(['email is already registered']);
    }
    if (await this.users.findByUsername(input.username)) {
      throw new ValidationError(['username is already taken']);
    }
    const password = await hashPassword(input.password);
    return this.users.create({
      email: input.email,
      username: input.username,
      password
    });
  }

  /**
   * Authenticates a user by email and password.
   * @param input validated login fields.
   * @returns the authenticated user entity.
   */
  async login(input: LoginInput): Promise<User> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid');
    }
    const matches = await verifyPassword(input.password, user.password);
    if (!matches) {
      throw new UnauthorizedError('email or password is invalid');
    }
    return user;
  }

  /**
   * Fetches the current user by id.
   * @param userId the authenticated user id.
   * @returns the user entity.
   */
  async getCurrentUser(userId: number): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('user not found');
    }
    return user;
  }

  /**
   * Updates mutable fields of the current user, guarding uniqueness.
   * @param userId the authenticated user id.
   * @param input validated update fields.
   * @returns the updated user entity.
   */
  async updateUser(userId: number, input: UpdateUserInput): Promise<User> {
    await this.assertUniqueOnUpdate(userId, input);
    const data: UpdateUserInput = { ...input };
    if (input.password) {
      data.password = await hashPassword(input.password);
    }
    return this.users.update(userId, data);
  }

  private async assertUniqueOnUpdate(userId: number, input: UpdateUserInput): Promise<void> {
    if (input.email) {
      const existing = await this.users.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['email is already registered']);
      }
    }
    if (input.username) {
      const existing = await this.users.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ValidationError(['username is already taken']);
      }
    }
  }
}
