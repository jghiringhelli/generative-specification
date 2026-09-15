import { ITagRepository } from '../ITagRepository';
import { IArticleRepository } from '../IArticleRepository';

export class InMemoryTagRepository implements ITagRepository {
  private readonly articleRepository: IArticleRepository;

  constructor(articleRepository: IArticleRepository) {
    this.articleRepository = articleRepository;
  }

  /**
   * Retrieves all unique tags that appear on any article.
   */
  async getAllTags(): Promise<string[]> {
    const { articles } = await this.articleRepository.findAll({ limit: 10000 });
    const tagSet = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tagList) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet);
  }

  /**
   * Normalizes and returns unique tag names.
   */
  async findOrCreateTags(tagNames: string[]): Promise<string[]> {
    return Array.from(new Set(tagNames));
  }
}
