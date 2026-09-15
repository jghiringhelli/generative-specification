import { ArticleRepository } from "../article/article.repository";

/** Response wrapping the list of all tags. */
export interface TagListResponse {
  tags: string[];
}

/**
 * Business logic for listing tags across all articles.
 */
export class TagService {
  private readonly articles: ArticleRepository;

  /**
   * @param articles Injected article repository.
   */
  constructor(articles: ArticleRepository) {
    this.articles = articles;
  }

  /**
   * List every unique tag across all articles.
   * @returns The de-duplicated tag list.
   */
  async list(): Promise<TagListResponse> {
    const tags = await this.articles.allTags();
    return { tags };
  }
}
