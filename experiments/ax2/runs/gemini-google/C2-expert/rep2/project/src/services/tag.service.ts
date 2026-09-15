import { TagRepository, tagRepository } from '../repositories/tag.repository';
import { TagsResponse } from '../types';

export class TagService {
  constructor(private tagRepo: TagRepository = tagRepository) {}

  async getTags(): Promise<TagsResponse> {
    const tags = await this.tagRepo.findAll();
    return {
      tags
    };
  }
}

export const tagService = new TagService();
