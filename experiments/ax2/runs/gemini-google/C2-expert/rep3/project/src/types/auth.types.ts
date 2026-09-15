/**
 * Payload stored in JWT token.
 */
export interface AuthUserPayload {
  id: number;
  email: string;
  username: string;
}

/**
 * User shape returned in auth responses.
 */
export interface UserResponseDto {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

/**
 * Profile shape returned in profile responses.
 */
export interface ProfileResponseDto {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}
