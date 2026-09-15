import { ITagRepository } from '../repositories/ITagRepository';

/**
 * The tags response envelope (Conduit spec).
 */
export interface TagListResponse {
  tags: string[];
}

/**
 * Business logic for tags.
 */
export class TagService {
  /**
   * @param tagRepository - Tag persistence port.
   */
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * List all unique tags that appear on any article, sorted alphabetically.
   * @returns The tag list response.
   */
  async list(): Promise<TagListResponse> {
    const tags = await this.tagRepository.findAll();
    return { tags: [...new Set(tags)].sort() };
  }
}
