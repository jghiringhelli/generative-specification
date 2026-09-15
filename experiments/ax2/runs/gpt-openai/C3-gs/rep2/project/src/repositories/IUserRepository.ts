export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly passwordHash?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserRecord>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
}
