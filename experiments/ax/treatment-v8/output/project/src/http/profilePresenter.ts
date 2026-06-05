/**
 * Response presenter: maps the domain {@link Profile} to the RealWorld
 * `profile` response envelope, keeping the persistence/domain shape out of the
 * wire contract.
 */
import type { Profile } from '../services/ProfileService.js';

/** The RealWorld `{ profile: {..} }` response body. */
export interface ProfileResponse {
  readonly profile: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

/**
 * Shape a profile for the wire.
 *
 * @param profile - the domain profile projection.
 * @returns the RealWorld profile response envelope.
 */
export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    profile: {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: profile.following,
    },
  };
}
