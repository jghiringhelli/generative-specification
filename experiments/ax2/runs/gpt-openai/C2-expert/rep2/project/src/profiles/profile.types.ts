export interface ProfileRecord {
  readonly id: number;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface ProfileResponse {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}
