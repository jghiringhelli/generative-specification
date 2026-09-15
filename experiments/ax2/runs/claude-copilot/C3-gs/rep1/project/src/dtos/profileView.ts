import { User } from '@prisma/client';

/**
 * Conduit profile payload.
 */
export interface ProfileView {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Build a profile view for the given user.
 * @param user - The profile owner.
 * @param following - Whether the requesting user follows this profile.
 * @returns The Conduit profile view.
 */
export function toProfileView(user: User, following: boolean): ProfileView {
  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    },
  };
}
