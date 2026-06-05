/**
 * Application service for the User aggregate: registration, login, and profile
 * retrieval/update. Orchestrates the persistence, hashing, and token ports;
 * contains no HTTP or framework concerns and never returns HTTP status codes
 * (it throws {@link AppError} subclasses the boundary maps).
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md, docs/use-cases.md
 */
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import type {
  IUserRepository,
  User,
  UserUpdate,
} from '../repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import type { ITokenService } from './ports/ITokenService.js';

/** Fields needed to register a new account. */
export interface RegisterInput {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

/** Credentials for login. */
export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

/**
 * Mutable profile fields; every field optional (partial update). Optionals
 * carry an explicit `| undefined` so a wire DTO whose keys are present-but-
 * undefined assigns cleanly under `exactOptionalPropertyTypes`.
 */
export interface UpdateUserInput {
  readonly email?: string | undefined;
  readonly username?: string | undefined;
  readonly password?: string | undefined;
  readonly bio?: string | null | undefined;
  readonly image?: string | null | undefined;
}

/** A user paired with a freshly minted session token. */
export interface AuthenticatedUser {
  readonly user: User;
  readonly token: string;
}

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /**
   * Register a new user.
   *
   * @throws ConflictError if the email or username is already taken.
   */
  async register(input: RegisterInput): Promise<AuthenticatedUser> {
    if (await this.users.existsByEmail(input.email)) {
      throw new ConflictError('email has already been taken', { email: ['has already been taken'] });
    }
    if (await this.users.existsByUsername(input.username)) {
      throw new ConflictError('username has already been taken', {
        username: ['has already been taken'],
      });
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.authenticate(user);
  }

  /**
   * Authenticate by email + password.
   *
   * @throws UnauthorizedError on unknown email or wrong password. The message is
   *   deliberately identical for both so it cannot be used to enumerate accounts.
   */
  async login(input: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('email or password is invalid', { credentials: ['invalid'] });
    }
    const matches = await this.hasher.verify(user.passwordHash, input.password);
    if (!matches) {
      throw new UnauthorizedError('email or password is invalid', { credentials: ['invalid'] });
    }
    return this.authenticate(user);
  }

  /**
   * Fetch the authenticated user's own profile.
   *
   * @throws NotFoundError if the id no longer resolves to a user.
   */
  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return this.authenticate(user);
  }

  /**
   * Apply a partial update to the authenticated user.
   *
   * @throws NotFoundError if the user no longer exists.
   * @throws ConflictError if a new email/username collides with another account.
   */
  async updateUser(userId: string, changes: UpdateUserInput): Promise<AuthenticatedUser> {
    const existing = await this.users.findById(userId);
    if (!existing) {
      throw new NotFoundError('User', userId);
    }
    await this.assertNoCollision(existing, changes);

    const update: UserUpdate = {
      ...(changes.email !== undefined ? { email: changes.email } : {}),
      ...(changes.username !== undefined ? { username: changes.username } : {}),
      ...(changes.bio !== undefined ? { bio: blankToNull(changes.bio) } : {}),
      ...(changes.image !== undefined ? { image: blankToNull(changes.image) } : {}),
      ...(changes.password !== undefined
        ? { passwordHash: await this.hasher.hash(changes.password) }
        : {}),
    };
    const updated = await this.users.update(userId, update);
    return this.authenticate(updated);
  }

  /** Reject email/username changes that would collide with a different account. */
  private async assertNoCollision(existing: User, changes: UpdateUserInput): Promise<void> {
    if (
      changes.email !== undefined &&
      changes.email !== existing.email &&
      (await this.users.existsByEmail(changes.email))
    ) {
      throw new ConflictError('email has already been taken', { email: ['has already been taken'] });
    }
    if (
      changes.username !== undefined &&
      changes.username !== existing.username &&
      (await this.users.existsByUsername(changes.username))
    ) {
      throw new ConflictError('username has already been taken', {
        username: ['has already been taken'],
      });
    }
  }

  /** Pair a user with a freshly signed token. */
  private authenticate(user: User): AuthenticatedUser {
    return { user, token: this.tokens.sign({ userId: user.id }) };
  }
}

/**
 * Coerce a nullable optional-profile field to its canonical empty form: an
 * explicit `null` and a blank/whitespace-only string both mean "no value", so
 * the wire never distinguishes `""` from `null` (RealWorld nullable-field
 * contract). A present, non-blank value is preserved verbatim.
 */
function blankToNull(value: string | null): string | null {
  return value === null || value.trim() === '' ? null : value;
}
