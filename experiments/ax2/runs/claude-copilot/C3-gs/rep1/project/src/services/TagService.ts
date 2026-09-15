import { ITagRepository } from '../repositories/ITagRepository';

/**
 * Application service for tags.
 */
export class TagService {
  private readonly tagRepository: ITagRepository;

  /**
   * @param tagRepository - Tag persistence port.
   */
  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository;
  }

  /**
   * List all tags used on any article.
   * @returns An object with the tag name array.
   */
  async list(): Promise<{ tags: string[] }> {
    const tags = await this.tagRepository.findAll();
    return { tags };
  }
}
