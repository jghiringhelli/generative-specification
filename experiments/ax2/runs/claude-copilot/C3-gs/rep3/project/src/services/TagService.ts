import { ITagRepository } from '../repositories/ITagRepository';
import { TagsResponse } from '../types/responses';

/** Orchestrates retrieval of the global tag list. */
export class TagService {
  constructor(private readonly tags: ITagRepository) {}

  async list(): Promise<TagsResponse> {
    return { tags: await this.tags.findAll() };
  }
}
