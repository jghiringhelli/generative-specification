import { ITagRepository } from '../../src/repositories/ITagRepository';
import { InMemoryArticleRepository } from './InMemoryArticleRepository';
import { ArticleListFilter } from '../../src/domain/types';

const ALL: ArticleListFilter = { limit: 1000, offset: 0 };

/**
 * In-memory fake implementing {@link ITagRepository}. Derives tags from the
 * article fake so results reflect only tags used on articles.
 */
export class InMemoryTagRepository implements ITagRepository {
  /**
   * @param articles - Article fake to derive tags from.
   */
  constructor(private readonly articles: InMemoryArticleRepository) {}

  /** @inheritdoc */
  async listAll(): Promise<string[]> {
    const { articles } = await this.articles.list(ALL);
    const tags = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tagList) {
        tags.add(tag);
      }
    }
    return [...tags].sort();
  }
}
