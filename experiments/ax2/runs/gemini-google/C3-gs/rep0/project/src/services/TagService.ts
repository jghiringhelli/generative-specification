// src/services/TagService.ts
import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  private tagRepository: ITagRepository;

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository;
  }

  async getAllTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
