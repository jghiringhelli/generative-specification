export type ProfileRecord = {
  readonly id: number;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
};

export type ProfileResponse = {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
};
