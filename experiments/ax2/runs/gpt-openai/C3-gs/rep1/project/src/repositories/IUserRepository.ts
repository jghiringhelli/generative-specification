export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface CreateUserRecord {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
}

export interface UpdateUserRecord {
  readonly email?: string;
  readonly username?: string;
  readonly passwordHash?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  create(data: CreateUserRecord): Promise<UserRecord>;
  update(id: string, data: UpdateUserRecord): Promise<UserRecord>;
}
