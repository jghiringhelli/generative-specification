import { TagRepository } from './repository';

export class TagService {
  public constructor(private readonly tags: TagRepository) {}

  /** Returns all unique persisted tag strings. */
  public async list(): Promise<{ tags: string[] }> {
    return { tags: await this.tags.list() };
  }
}
