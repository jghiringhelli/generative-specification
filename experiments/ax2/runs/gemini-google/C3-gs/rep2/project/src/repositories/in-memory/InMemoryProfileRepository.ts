import { IProfileRepository, ProfileEntity } from '../IProfileRepository';
import { IUserRepository } from '../IUserRepository';
import { NotFoundError } from '../../errors/AppError';

export class InMemoryProfileRepository implements IProfileRepository {
  private readonly userRepository: IUserRepository;
  private readonly follows: Set<string> = new Set();

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Retrieves profile data for a specific username and calculates following status.
   */
  async getProfile(username: string, currentUserId?: string): Promise<ProfileEntity | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }
    const following = currentUserId ? this.follows.has(`${currentUserId}:${user.id}`) : false;
    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    };
  }

  /**
   * Establishes a follow relationship between followerId and target username.
   */
  async follow(followerId: string, usernameToFollow: string): Promise<ProfileEntity> {
    const userToFollow = await this.userRepository.findByUsername(usernameToFollow);
    if (!userToFollow) {
      throw new NotFoundError('Profile not found');
    }
    this.follows.add(`${followerId}:${userToFollow.id}`);
    return {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true,
    };
  }

  /**
   * Removes a follow relationship between followerId and target username.
   */
  async unfollow(followerId: string, usernameToUnfollow: string): Promise<ProfileEntity> {
    const userToUnfollow = await this.userRepository.findByUsername(usernameToUnfollow);
    if (!userToUnfollow) {
      throw new NotFoundError('Profile not found');
    }
    this.follows.delete(`${followerId}:${userToUnfollow.id}`);
    return {
      username: userToUnfollow.username,
      bio: userToUnfollow.bio,
      image: userToUnfollow.image,
      following: false,
    };
  }

  /**
   * Cleans all stored follow relationships.
   */
  clear(): void {
    this.follows.clear();
  }
}
