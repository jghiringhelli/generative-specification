import { TagRepository } from '../repositories/tagRepository';

export class TagService {
  constructor(private tagRepository: TagRepository) {}

  async getAllTags(): Promise<string[]> {
    return this.tagRepository.getAllTags();
  }
}
