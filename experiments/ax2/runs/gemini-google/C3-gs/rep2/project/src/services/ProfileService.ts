import { IProfileRepository, ProfileEntity } from '../repositories/IProfileRepository';
import { NotFoundError } from '../errors/AppError';

export class ProfileService {
  private readonly profileRepository: IProfileRepository;

  /**
   * Initializes profile business service.
   * @param profileRepository The repository handling profile queries and follow states.
   */
  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  /**
   * Retrieves profile details for a given username.
   * @param username The username of the user profile.
   * @param currentUserId Optional ID of the requesting user to calculate follow status.
   * @returns User profile entity.
   */
  public async getProfile(username: string, currentUserId?: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.getProfile(username, currentUserId);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    return profile;
  }

  /**
   * Establishes a follow link between the authenticated user and target username.
   * @param followerId Authenticated user ID.
   * @param usernameToFollow Username of the target user.
   * @returns Updated target user profile with following=true.
   */
  public async followUser(followerId: string, usernameToFollow: string): Promise<ProfileEntity> {
    return this.profileRepository.follow(followerId, usernameToFollow);
  }

  /**
   * Removes a follow link between the authenticated user and target username.
   * @param followerId Authenticated user ID.
   * @param usernameToUnfollow Username of the target user.
   * @returns Updated target user profile with following=false.
   */
  public async unfollowUser(followerId: string, usernameToUnfollow: string): Promise<ProfileEntity> {
    return this.profileRepository.unfollow(followerId, usernameToUnfollow);
  }
}
