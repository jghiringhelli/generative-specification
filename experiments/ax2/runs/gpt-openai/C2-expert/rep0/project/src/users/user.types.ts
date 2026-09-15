export type UserRecord = {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly bio: string | null;
  readonly image: string | null;
};

export type CreateUserData = {
  readonly email: string;
  readonly username: string;
  readonly password: string;
};

export type UpdateUserData = Partial<CreateUserData> & {
  readonly bio?: string | null;
  readonly image?: string | null;
};

export type UserResponse = {
  readonly email: string;
  readonly token: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
};
