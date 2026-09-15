export interface UserResponse {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface RegisterUserCommand {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

export interface LoginUserCommand {
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserCommand {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}
