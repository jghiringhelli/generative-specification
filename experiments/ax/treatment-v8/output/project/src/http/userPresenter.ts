/**
 * Response presenter: maps the domain {@link AuthenticatedUser} to the
 * RealWorld `user` response envelope. Keeps the persistence/domain shape out of
 * the wire contract and guarantees the password hash never leaves the service.
 */
import type { AuthenticatedUser } from '../services/UserService.js';

/** The RealWorld `{ user: {..} }` response body. */
export interface UserResponse {
  readonly user: {
    readonly email: string;
    readonly token: string;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
  };
}

/**
 * Shape an authenticated user for the wire.
 *
 * @param authenticated - the user plus its session token.
 * @returns the RealWorld user response envelope.
 */
export function toUserResponse(authenticated: AuthenticatedUser): UserResponse {
  const { user, token } = authenticated;
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
