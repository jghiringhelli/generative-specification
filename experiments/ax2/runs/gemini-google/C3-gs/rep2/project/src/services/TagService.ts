import { ITagRepository } from '../repositories/ITagRepository';
import { TagsResponseDTO } from '../dtos/TagDTOs';

export class TagService {
  private readonly tagRepository: ITagRepository;

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository;
  }

  /**
   * Retrieves all unique tags that appear on any article.
   */
  public async getTags(): Promise<TagsResponseDTO> {
    const tags = await this.tagRepository.getAllTags();
    return { tags };
  }
}
