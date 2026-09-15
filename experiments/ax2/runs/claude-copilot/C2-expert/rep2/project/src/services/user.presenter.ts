import { User } from '@prisma/client';
import { signToken } from '../utils/token';

export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Builds the authenticated user envelope including a fresh JWT.
 * @param user the persisted user.
 * @returns the RealWorld user response DTO.
 */
export function toUserResponse(user: User): UserResponse {
  return {
    user: {
      email: user.email,
      token: signToken({ id: user.id, username: user.username }),
      username: user.username,
      bio: user.bio,
      image: user.image
    }
  };
}

/**
 * Builds a profile envelope.
 * @param user the profile owner.
 * @param following whether the viewer follows the owner.
 * @returns the RealWorld profile response DTO.
 */
export function toProfileResponse(
  user: Pick<User, 'username' | 'bio' | 'image'>,
  following: boolean
): ProfileResponse {
  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    }
  };
}
