import { ITagRepository, TagRepository } from './tag.repository';

export class TagService {
  constructor(private readonly tagRepository: ITagRepository = new TagRepository()) {}

  async getTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
