import { prisma } from '../lib/prisma';

/**
 * Persistence adapter for article favorites.
 */
export class FavoriteRepository {
  private readonly client = prisma;

  /**
   * Determines whether a user has favorited an article.
   * @param userId The user's id.
   * @param articleId The article's id.
   * @returns `true` when the favorite exists.
   */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const existing = await this.client.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } }
    });
    return existing !== null;
  }

  /**
   * Adds a favorite idempotently.
   * @param userId The user's id.
   * @param articleId The article's id.
   */
  async favorite(userId: number, articleId: number): Promise<void> {
    await this.client.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  /**
   * Removes a favorite idempotently.
   * @param userId The user's id.
   * @param articleId The article's id.
   */
  async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.client.favorite.deleteMany({ where: { userId, articleId } });
  }
}
