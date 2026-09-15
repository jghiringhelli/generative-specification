import { ITagRepository } from '../../src/repositories/ITagRepository';
import { InMemoryArticleRepository } from './InMemoryArticleRepository';

/**
 * In-memory fake implementation of {@link ITagRepository} for tests, derived
 * from the tags present on articles.
 */
export class InMemoryTagRepository implements ITagRepository {
  /**
   * @param articles - In-memory article repository providing tag data.
   */
  constructor(private readonly articles: InMemoryArticleRepository) {}

  /** @inheritdoc */
  async findAll(): Promise<string[]> {
    return this.articles.allTags();
  }
}
