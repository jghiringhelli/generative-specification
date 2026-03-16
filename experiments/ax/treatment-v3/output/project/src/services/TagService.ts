import { ITagRepository } from '../repositories/ITagRepository';

/**
 * Tag service - business logic for tags.
 * Depends on ITagRepository interface (injected).
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all unique tags used in any article.
   * @returns Array of tag names
   */
  async getAllTags(): Promise<string[]> {
    return this.tagRepository.getAllTags();
  }
}
