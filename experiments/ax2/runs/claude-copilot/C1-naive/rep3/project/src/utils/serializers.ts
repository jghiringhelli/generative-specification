import { User } from '@prisma/client';
import { generateToken } from '../utils/jwt';

export function toUserResponse(user: User) {
  return {
    user: {
      email: user.email,
      username: user.username,
      bio: user.bio || '',
      image: user.image || '',
      token: generateToken({ id: user.id, username: user.username }),
    },
  };
}

export function toProfileResponse(user: User, following: boolean) {
  return {
    profile: {
      username: user.username,
      bio: user.bio || '',
      image: user.image || '',
      following,
    },
  };
}
