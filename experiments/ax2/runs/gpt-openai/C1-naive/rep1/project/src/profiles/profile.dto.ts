export interface ProfileSource {
  username: string;
  bio: string | null;
  image: string | null;
  followers: Array<{ id: number }>;
}

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export function toProfileResponse(
  profile: ProfileSource,
  currentUserId?: number,
): ProfileResponse {
  return {
    username: profile.username,
    bio: profile.bio,
    image: profile.image,
    following: currentUserId
      ? profile.followers.some((follower) => follower.id === currentUserId)
      : false,
  };
}
