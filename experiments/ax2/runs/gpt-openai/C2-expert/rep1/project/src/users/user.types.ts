export interface UserRecord {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}
