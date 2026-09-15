import { TagRepository } from '../repositories/tag.repository';

/**
 * Service managing tags.
 */
export class TagService {
  private readonly tagRepository: TagRepository;

  /**
   * Initializes TagService.
   */
  constructor(tagRepository: TagRepository = new TagRepository()) {
    this.tagRepository = tagRepository;
  }

  /**
   * Retrieves all unique tags across the platform.
   *
   * @returns {Promise<string[]>} Array of tag strings
   */
  async getAllTags(): Promise<string[]> {
    return this.tagRepository.findAllTags();
  }
}
