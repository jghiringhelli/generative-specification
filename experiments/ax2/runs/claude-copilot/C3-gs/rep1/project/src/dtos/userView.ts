import { User } from '@prisma/client';

/**
 * Conduit user payload returned to authenticated clients.
 */
export interface UserView {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

/**
 * Build the authenticated user response with the supplied token.
 * @param user - The persisted user entity.
 * @param token - A signed JWT for the user.
 * @returns The Conduit user view.
 */
export function toUserView(user: User, token: string): UserView {
  return {
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}
