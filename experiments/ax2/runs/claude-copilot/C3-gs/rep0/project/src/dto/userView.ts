import { UserEntity } from '../domain/types';

/**
 * The `user` object returned by auth endpoints (Conduit spec).
 */
export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string;
    image: string | null;
  };
}

/**
 * The `profile` object returned by profile endpoints (Conduit spec).
 */
export interface ProfileResponse {
  profile: {
    username: string;
    bio: string;
    image: string | null;
    following: boolean;
  };
}

/**
 * Build a `UserResponse` from a user entity and its freshly issued token.
 * @param user - The user entity.
 * @param token - The signed JWT.
 * @returns The user response DTO.
 */
export function toUserResponse(user: UserEntity, token: string): UserResponse {
  return {
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio ?? '',
      image: user.image ?? null
    }
  };
}

/**
 * Build a `ProfileResponse` from a user entity and follow state.
 * @param user - The profile owner's user entity.
 * @param following - Whether the requesting user follows this profile.
 * @returns The profile response DTO.
 */
export function toProfileResponse(user: UserEntity, following: boolean): ProfileResponse {
  return {
    profile: {
      username: user.username,
      bio: user.bio ?? '',
      image: user.image ?? null,
      following
    }
  };
}
