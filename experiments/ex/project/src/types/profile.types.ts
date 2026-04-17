
/**
 * Profile response DTO (RealWorld API format).
 */
export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}
