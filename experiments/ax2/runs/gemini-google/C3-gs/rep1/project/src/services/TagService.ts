import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  private readonly tagRepository: ITagRepository;

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository;
  }

  async getTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
