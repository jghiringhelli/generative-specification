import { ITagRepository } from '../repositories/ITagRepository';

export interface TagsResponse {
  tags: string[];
}

/**
 * Business logic for retrieving the set of tags used across articles.
 */
export class TagService {
  constructor(private readonly tags: ITagRepository) {}

  /** Return every distinct tag that appears on any article. */
  async listTags(): Promise<TagsResponse> {
    return { tags: await this.tags.findAll() };
  }
}
