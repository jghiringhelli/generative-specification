import { ITagRepository } from '../repositories/tag.repository';
import { TagsResponse } from '../types/tag.types';

/**
 * Tag service.
 * Handles tag operations.
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all tags.
   * Returns unique tag names ordered alphabetically.
   */
  async getTags(): Promise<TagsResponse> {
    const tags = await this.tagRepository.findAll();

    return {
      tags: tags.map((tag) => tag.name)
    };
  }
}
