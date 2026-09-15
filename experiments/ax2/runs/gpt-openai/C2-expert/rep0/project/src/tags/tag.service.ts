import { TagRepositoryPort } from "./tag.repository";

export class TagService {
  public constructor(private readonly tags: TagRepositoryPort) {}

  /** Returns all unique persisted tag strings. */
  public list(): Promise<ReadonlyArray<string>> {
    return this.tags.list();
  }
}
