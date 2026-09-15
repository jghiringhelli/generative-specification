export interface ProfileResponse {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}
