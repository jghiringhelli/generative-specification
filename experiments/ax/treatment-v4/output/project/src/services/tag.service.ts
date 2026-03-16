import { ITagRepository } from '../repositories/ITagRepository';

/**
 * Tag service.
 * Handles tag retrieval operations.
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all unique tags.
   * @returns Array of tag names
   */
  async getAllTags(): Promise<string[]> {
    return await this.tagRepository.listAll();
  }
}
