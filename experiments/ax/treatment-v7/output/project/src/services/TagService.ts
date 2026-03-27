import type { ITagRepository } from '../repositories/ITagRepository';

/**
 * Business logic for tag retrieval.
 *
 * Depends on `ITagRepository` (injected) — never on concrete Prisma classes.
 * Wire the concrete implementation at the composition root (`src/server.ts`).
 */
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  /**
   * Retrieve all unique tags used across published articles.
   *
   * @returns Array of distinct tag strings
   */
  async getAllTags(): Promise<string[]> {
    return this.tagRepository.findAll();
  }
}
