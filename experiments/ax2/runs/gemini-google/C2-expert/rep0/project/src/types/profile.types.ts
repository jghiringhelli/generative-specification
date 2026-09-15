export interface ProfileData {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface ProfileResponse {
  readonly profile: ProfileData;
}
