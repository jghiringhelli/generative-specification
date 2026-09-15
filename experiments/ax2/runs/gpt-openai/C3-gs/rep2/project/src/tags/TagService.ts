import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  public constructor(private readonly tags: ITagRepository) {}

  /** Lists all tags currently used by articles. */
  public async list(): Promise<ReadonlyArray<string>> {
    return this.tags.list();
  }
}
