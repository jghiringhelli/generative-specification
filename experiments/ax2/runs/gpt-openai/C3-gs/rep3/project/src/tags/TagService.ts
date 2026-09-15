import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  public constructor(private readonly tags: ITagRepository) {}

  /** Lists unique tags currently assigned to at least one article. */
  public list(): Promise<ReadonlyArray<string>> {
    return this.tags.list();
  }
}
