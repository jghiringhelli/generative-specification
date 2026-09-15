import { TagRepositoryPort } from './tag.repository';

export class TagService {
  public constructor(private readonly tags: TagRepositoryPort) {}

  /** Lists all unique persisted article tags. */
  public list(): Promise<ReadonlyArray<string>> {
    return this.tags.list();
  }
}
