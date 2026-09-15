import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  public constructor(private readonly tags: ITagRepository) {}

  public list(): Promise<readonly string[]> {
    return this.tags.listUnique();
  }
}
