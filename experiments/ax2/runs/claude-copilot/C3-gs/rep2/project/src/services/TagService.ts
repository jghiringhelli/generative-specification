import { ITagRepository } from '../repositories/ITagRepository';

/**
 * Business logic for tags.
 */
export class TagService {
  private readonly tags: ITagRepository;

  /**
   * @param tags - Tag repository port.
   */
  constructor(tags: ITagRepository) {
    this.tags = tags;
  }

  /**
   * List every distinct tag used on any article.
   * @returns Sorted unique tag names.
   */
  async list(): Promise<string[]> {
    return this.tags.listAll();
  }
}
