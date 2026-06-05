/**
 * Port: persistence boundary for User entities.
 *
 * Defined in the repository-port layer; concrete adapters (e.g. a Prisma-backed
 * implementation) are injected at the composition root. The domain depends on
 * this abstraction, never on a concrete database.
 */

/** A persisted user, as the domain understands it (no HTTP, no SQL concerns). */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  /** Argon2id hash — never the plaintext password. */
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Fields required to create a new user. */
export interface NewUser {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
}

/** Partial mutation set for an existing user. */
export interface UserUpdate {
  readonly email?: string;
  readonly username?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
  readonly passwordHash?: string;
}

export interface IUserRepository {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, changes: UserUpdate): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}
