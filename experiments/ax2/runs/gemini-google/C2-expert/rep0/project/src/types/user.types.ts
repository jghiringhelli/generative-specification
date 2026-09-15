export interface AuthUser {
  readonly id: number;
  readonly username: string;
  readonly email: string;
}

export interface UserEntity {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UserResponseData {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface UserResponse {
  readonly user: UserResponseData;
}

export interface RegisterUserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserInput {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}
