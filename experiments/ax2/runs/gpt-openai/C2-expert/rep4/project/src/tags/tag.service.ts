import { ITagRepository } from "./tag.repository";

export class TagService {
  public constructor(private readonly tags: ITagRepository) {}

  public list(): Promise<string[]> {
    return this.tags.list();
  }
}
