import { ArticleRepository } from '../repositories/article.repository';

/**
 * Application service implementing tag listing.
 */
export class TagService {
  private readonly articleRepository: ArticleRepository;

  constructor(articleRepository: ArticleRepository) {
    this.articleRepository = articleRepository;
  }

  /**
   * Returns the unique set of tags across all articles.
   * @returns A sorted list of unique tag strings.
   */
  async listTags(): Promise<string[]> {
    return this.articleRepository.findAllTags();
  }
}
