import { TagRepositoryPort } from "./tag.repository";

export class TagService {
  public constructor(private readonly tags: TagRepositoryPort) {}

  /** Returns all unique persisted tag names. */
  public list(): Promise<string[]> {
    return this.tags.listNames();
  }
}
