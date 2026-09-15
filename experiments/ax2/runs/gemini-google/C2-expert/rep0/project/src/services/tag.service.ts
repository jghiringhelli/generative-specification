import { ITagRepository, TagRepository } from '../repositories/tag.repository';
import { TagsResponse } from '../types/tag.types';

export interface ITagService {
  getTags(): Promise<TagsResponse>;
}

export class TagService implements ITagService {
  private readonly tagRepository: ITagRepository;

  constructor(tagRepository: ITagRepository = new TagRepository()) {
    this.tagRepository = tagRepository;
  }

  /**
   * Retrieves list of all distinct tags across articles.
   *
   * @returns {Promise<TagsResponse>} Object containing tags array
   */
  public async getTags(): Promise<TagsResponse> {
    const tags = await this.tagRepository.findAllTags();
    return { tags };
  }
}
