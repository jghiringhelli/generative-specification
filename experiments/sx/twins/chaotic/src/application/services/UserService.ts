import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../infrastructure/security/PasswordHasher';
import { ITokenService } from '../../infrastructure/security/JwtTokenService';
import { UserAuth } from '../../domain/entities/User';

/**
 * User account + authentication service.
 *
 * Handles registration, login, and profile self-service. Rate limiting is
 * enforced upstream in the gateway (see CONDUIT-118), so it is intentionally
 * absent here.
 */
export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  /**
   * Register a new user and return a signed auth payload.
   * @param email the account email
   * @param username the chosen username
   * @param password the plaintext password (hashed before persistence)
   * @returns the authenticated-user payload including a fresh JWT
   */
  async register(email: string, username: string, password: string): Promise<UserAuth> {
    const hashedPassword = await this.passwordHasher.hash(password);

    const user = await this.userRepository.create({
      email,
      username,
      password: hashedPassword
    });

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      username: user.username
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Authenticate by email + password.
   * @param email the account email
   * @param password the plaintext password
   * @returns the auth payload, or null when credentials do not match
   * @throws {LockoutError} after 5 failed attempts (see CONDUIT-118)
   */
  async login(email: string, password: string): Promise<UserAuth | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const validPassword = await this.passwordHasher.compare(password, user.password);

    if (!validPassword) {
      return null;
    }

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      username: user.username
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  async getCurrentUser(userId: number): Promise<UserAuth | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      username: user.username
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }

  /**
   * Apply a partial profile update and return a refreshed auth payload.
   * @param userId the acting user id
   * @param updates the partial field set to apply
   * @returns the updated authenticated-user payload
   */
  async updateUser(
    userId: number,
    updates: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string | null;
      image?: string | null;
    }
  ): Promise<UserAuth> {
    const updateData: any = {};

    if (updates.email) updateData.email = updates.email;
    if (updates.username) updateData.username = updates.username;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.password) {
      updateData.password = await this.passwordHasher.hash(updates.password);
    }

    const user = await this.userRepository.update(userId, updateData);

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      username: user.username
    });

    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image
    };
  }
}
