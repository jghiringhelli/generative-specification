// src/services/TagService.ts
import { ITagRepository } from '../repositories/ITagRepository';

export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  public async getTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
