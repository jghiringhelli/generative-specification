import pkg, { SignOptions } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { RegisterUserInput, LoginUserInput, UpdateUserInput, UserResponseData } from '../dtos/UserDTOs';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/AppError';

const { sign } = pkg;

export class AuthService {
  private readonly userRepository: IUserRepository;
  private readonly jwtSecret: string;
  private readonly jwtExpiry: SignOptions['expiresIn'];

  /**
   * Initializes the authentication service.
   * @param userRepository Data access repository for user entities.
   * @param jwtSecret Secret string for signing JWT tokens.
   * @param jwtExpiry Expiration expression for JWT tokens.
   */
  constructor(
    userRepository: IUserRepository,
    jwtSecret: string = process.env.JWT_SECRET || 'secret-jwt-key',
    jwtExpiry?: string
  ) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiry = (jwtExpiry ?? process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
  }

  /**
   * Registers a new user in the system.
   * @param input Registration payload containing username, email, and password.
   * @returns User profile data along with an authentication token.
   */
  public async register(input: RegisterUserInput): Promise<UserResponseData> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email has already been taken');
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError('Username has already been taken');
    }

    const passwordHash = await argon2.hash(input.password);
    const createdUser = await this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      bio: null,
      image: null,
    });

    const token = this.generateToken(createdUser);
    return this.mapToUserResponse(createdUser, token);
  }

  /**
   * Authenticates an existing user via email and password credentials.
   * @param input Credentials containing email and plain-text password.
   * @returns User profile data along with an authentication token.
   */
  public async login(input: LoginUserInput): Promise<UserResponseData> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);
    return this.mapToUserResponse(user, token);
  }

  /**
   * Retrieves the current authenticated user's profile.
   * @param userId The unique identifier of the authenticated user.
   * @returns User profile data along with an active authentication token.
   */
  public async getCurrentUser(userId: string): Promise<UserResponseData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const token = this.generateToken(user);
    return this.mapToUserResponse(user, token);
  }

  /**
   * Updates fields on an existing authenticated user.
   * @param userId The unique identifier of the user to update.
   * @param input Optional fields to update (email, username, password, bio, image).
   * @returns Updated user profile data along with an active authentication token.
   */
  public async updateUser(userId: string, input: UpdateUserInput): Promise<UserResponseData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ConflictError('Email has already been taken');
      }
    }

    if (input.username && input.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(input.username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ConflictError('Username has already been taken');
      }
    }

    const passwordHash = input.password ? await argon2.hash(input.password) : undefined;

    const updatedUser = await this.userRepository.update(userId, {
      email: input.email,
      username: input.username,
      passwordHash,
      bio: input.bio,
      image: input.image,
    });

    const token = this.generateToken(updatedUser);
    return this.mapToUserResponse(updatedUser, token);
  }

  /**
   * Signs a JWT token containing user identity claims.
   * @param user The user entity for whom to generate the token.
   * @returns Signed JWT string.
   */
  public generateToken(user: UserEntity): string {
    return sign({ id: user.id, username: user.username }, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
    });
  }

  /**
   * Formats a user entity into the public API user response schema.
   * @param user The user entity.
   * @param token The active JWT token string.
   * @returns Formatted user response.
   */
  private mapToUserResponse(user: UserEntity, token: string): UserResponseData {
    return {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }
}
