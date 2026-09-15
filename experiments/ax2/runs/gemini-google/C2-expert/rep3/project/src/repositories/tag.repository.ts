import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prisma.client';

/**
 * Data access repository for Tag entities.
 */
export class TagRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes TagRepository.
   *
   * @param {PrismaClient} [prisma] Optional PrismaClient instance
   */
  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  /**
   * Retrieves all unique tag names across articles.
   *
   * @returns {Promise<string[]>} Array of unique tag names
   */
  async findAllTags(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return tags.map((t) => t.name);
  }
}
