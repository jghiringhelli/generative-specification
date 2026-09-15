import { ArticleRepository } from '../articles/article.repository';

/** Response envelope for the tag list. */
export interface TagListResponse {
  tags: string[];
}

/**
 * Business logic for aggregating article tags.
 */
export class TagService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  /**
   * Lists all unique tags across every article.
   * @returns the tag list response
   */
  async listTags(): Promise<TagListResponse> {
    const tags = await this.articleRepository.allTags();
    return { tags };
  }
}
