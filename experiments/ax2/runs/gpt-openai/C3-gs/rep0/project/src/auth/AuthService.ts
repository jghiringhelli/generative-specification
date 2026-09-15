import argon2 from 'argon2';
import pkg, { SignOptions } from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../errors/AppError';
import { IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';

const { sign, verify } = pkg;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

export interface AuthUser {
  readonly email: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly token: string;
}

export interface RegistrationInput {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface UserUpdateInput {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export class AuthService {
  public constructor(
    private readonly users: IUserRepository,
    private readonly jwtSecret: string,
  ) {}

  public async register(input: RegistrationInput): Promise<AuthUser> {
    await this.ensureAvailable(input.email, input.username);
    const passwordHash = await argon2.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return this.toAuthUser(user);
  }

  public async login(email: string, password: string): Promise<AuthUser> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.toAuthUser(user);
  }

  public async getCurrent(userId: string): Promise<AuthUser> {
    const user = await this.requireUser(userId);
    return this.toAuthUser(user);
  }

  public async update(userId: string, input: UserUpdateInput): Promise<AuthUser> {
    const current = await this.requireUser(userId);
    await this.ensureUpdateAvailable(current, input);
    const update: UpdateUserRecord = {
      email: input.email,
      username: input.username,
      bio: input.bio,
      image: input.image,
      passwordHash: input.password ? await argon2.hash(input.password) : undefined,
    };
    const user = await this.users.update(userId, update);
    return this.toAuthUser(user);
  }

  public verifyToken(token: string): string {
    try {
      const payload = verify(token, this.jwtSecret);
      if (typeof payload === 'string' || typeof payload.sub !== 'string') {
        throw new UnauthorizedError('Invalid authentication token');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return user;
  }

  private async ensureAvailable(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) throw new ConflictError('Email is already in use');
    if (await this.users.findByUsername(username)) throw new ConflictError('Username is already in use');
  }

  private async ensureUpdateAvailable(current: UserRecord, input: UserUpdateInput): Promise<void> {
    if (input.email && input.email !== current.email && await this.users.findByEmail(input.email)) {
      throw new ConflictError('Email is already in use');
    }
    if (input.username && input.username !== current.username && await this.users.findByUsername(input.username)) {
      throw new ConflictError('Username is already in use');
    }
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token: sign({}, this.jwtSecret, { subject: user.id, expiresIn: JWT_EXPIRY }),
    };
  }
}
