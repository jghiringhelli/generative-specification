import { ArticleRepository } from '../repositories/article.repository';

/**
 * Application service exposing the set of tags across all articles.
 */
export class TagService {
  constructor(private readonly articles: ArticleRepository) {}

  /**
   * Returns every unique tag persisted across all articles.
   * @returns a list of tag strings.
   */
  async list(): Promise<string[]> {
    const tags = await this.articles.allTags();
    return tags.sort();
  }
}
