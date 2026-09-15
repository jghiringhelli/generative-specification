import { ArticleWithRelations } from '../repositories/article.repository';
import { ArticleListItem, SingleArticleData } from '../types/article.types';
import { IProfileRepository, ProfileRepository } from '../repositories/profile.repository';

export class ArticleMapper {
  private readonly profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository = new ProfileRepository()) {
    this.profileRepository = profileRepository;
  }

  /**
   * Maps a database article record to an ArticleListItem (omitting body per spec).
   */
  public async toListItem(
    record: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleListItem> {
    const favorited = Boolean(
      currentUserId && record.favorites.some((fav) => fav.userId === currentUserId)
    );

    const profile = await this.profileRepository.findProfileByUsername(
      record.author.username,
      currentUserId
    );

    return {
      slug: record.slug,
      title: record.title,
      description: record.description,
      tagList: record.tags.map((t) => t.name),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorited,
      favoritesCount: record._count.favorites,
      author: profile || {
        username: record.author.username,
        bio: record.author.bio,
        image: record.author.image,
        following: false
      }
    };
  }

  /**
   * Maps a database article record to SingleArticleData (including body).
   */
  public async toSingleData(
    record: ArticleWithRelations,
    currentUserId?: number
  ): Promise<SingleArticleData> {
    const listItem = await this.toListItem(record, currentUserId);
    return {
      ...listItem,
      body: record.body
    };
  }
}
