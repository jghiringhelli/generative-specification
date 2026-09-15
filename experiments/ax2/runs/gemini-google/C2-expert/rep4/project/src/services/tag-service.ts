import { ITagRepository } from '../repositories/tag-repository.interface';
import { TagRepository } from '../repositories/tag-repository';

export interface TagsResponseData {
  readonly tags: readonly string[];
}

/**
 * Service managing tag listings.
 */
export class TagService {
  private readonly tagRepo: ITagRepository;

  /**
   * Constructs the TagService.
   *
   * @param {ITagRepository} [tagRepository=new TagRepository()] - Injected tag repo
   */
  constructor(tagRepository: ITagRepository = new TagRepository()) {
    this.tagRepo = tagRepository;
  }

  /**
   * Retrieves all unique tags in the system.
   *
   * @returns {Promise<TagsResponseData>} Tags array wrapper
   */
  public async getTags(): Promise<TagsResponseData> {
    const tags = await this.tagRepo.findAllTags();
    return { tags };
  }
}
