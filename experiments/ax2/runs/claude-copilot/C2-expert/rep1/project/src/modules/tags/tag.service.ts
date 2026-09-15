import { ArticleRepository } from '../articles/article.repository';

/** Envelope for the tags list. */
export interface TagListResponse {
  tags: string[];
}

/**
 * Business logic for tag aggregation.
 */
export class TagService {
  /** @param articleRepository injected article persistence port */
  constructor(private readonly articleRepository: ArticleRepository) {}

  /**
   * Returns all unique tags across every article.
   * @returns the tag list response
   */
  async list(): Promise<TagListResponse> {
    return { tags: await this.articleRepository.allTags() };
  }
}
