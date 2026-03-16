
/**
 * Tag service.
 * Handles tag retrieval.
 */

import type { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all unique tags.
   * Returns tags that have been used in at least one article.
   */
  async getAllTags(): Promise<string[]> {
    return await this.tagRepository.listAll();
  }
}
