import { TagRepository } from '../repositories/tag.repository';

export interface TagsResponse {
  tags: string[];
}

export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * Get all tags
   */
  async getTags(): Promise<TagsResponse> {
    const tags = await this.tagRepository.findAll();
    return { tags };
  }
}
