import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Retrieves all unique tags that appear on any article.
   * @returns Array of unique tag name strings.
   */
  async getTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
