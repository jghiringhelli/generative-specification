import type { ITagRepository } from '../repositories/ITagRepository.js';

/**
 * Service handling tag retrieval.
 * Depends on ITagRepository (injected at composition root).
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Get all unique tags that appear on any article.
   * @returns Object with tags array.
   */
  async getTags(): Promise<{ tags: ReadonlyArray<string> }> {
    const tags = await this.tagRepository.findAll();
    return { tags };
  }
}
