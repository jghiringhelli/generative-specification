import { User } from '@prisma/client';
import { generateToken } from './jwt';

export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string;
    image: string;
  };
}

export function toUserResponse(user: User, token?: string): UserResponse {
  return {
    user: {
      email: user.email,
      token: token || generateToken({ id: user.id, username: user.username }),
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}

export interface ProfileResponse {
  profile: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

export function toProfileResponse(user: User, following: boolean): ProfileResponse {
  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    },
  };
}
