// src/repositories/ITagRepository.ts

export interface ITagRepository {
  findAll(): Promise<string[]>;
}
