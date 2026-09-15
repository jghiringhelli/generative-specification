import { IProfileRepository } from '../repositories/profile-repository.interface';
import { ProfileRepository } from '../repositories/profile-repository';
import { NotFoundError } from '../errors/http-error';

export interface ProfileResponseData {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/**
 * Service managing user profiles and social following logic.
 */
export class ProfileService {
  private readonly profileRepo: IProfileRepository;

  /**
   * Constructs the ProfileService.
   *
   * @param {IProfileRepository} [profileRepository=new ProfileRepository()] - Injected repository
   */
  constructor(profileRepository: IProfileRepository = new ProfileRepository()) {
    this.profileRepo = profileRepository;
  }

  /**
   * Retrieves a user profile by username.
   *
   * @param {string} username - Target username
   * @param {string} [currentUserId] - Optional authenticated viewer user ID
   * @returns {Promise<ProfileResponseData>} The requested profile
   */
  public async getProfile(
    username: string,
    currentUserId?: string
  ): Promise<ProfileResponseData> {
    const user = await this.profileRepo.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }

    let following = false;
    if (currentUserId) {
      following = await this.profileRepo.isFollowing(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /**
   * Follows a target user and returns their updated profile.
   *
   * @param {string} username - Target username to follow
   * @param {string} currentUserId - ID of authenticated follower
   * @returns {Promise<ProfileResponseData>} The updated profile
   */
  public async followUser(
    username: string,
    currentUserId: string
  ): Promise<ProfileResponseData> {
    const user = await this.profileRepo.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }

    if (currentUserId !== user.id) {
      await this.profileRepo.follow(currentUserId, user.id);
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: true,
    };
  }

  /**
   * Unfollows a target user and returns their updated profile.
   *
   * @param {string} username - Target username to unfollow
   * @param {string} currentUserId - ID of authenticated follower
   * @returns {Promise<ProfileResponseData>} The updated profile
   */
  public async unfollowUser(
    username: string,
    currentUserId: string
  ): Promise<ProfileResponseData> {
    const user = await this.profileRepo.findByUsername(username);
    if (!user) {
      throw new NotFoundError('Profile not found');
    }

    await this.profileRepo.unfollow(currentUserId, user.id);

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false,
    };
  }
}
