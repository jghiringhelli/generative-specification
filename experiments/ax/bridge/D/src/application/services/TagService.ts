import { ITagRepository } from '../../domain/repositories/ITagRepository';

export class TagService {
  constructor(private tagRepository: ITagRepository) {}

  async getAllTags(): Promise<string[]> {
    return await this.tagRepository.findAll();
  }
}
