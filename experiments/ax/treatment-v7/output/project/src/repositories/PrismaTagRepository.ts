import type { PrismaClient } from '@prisma/client';
import type { ITagRepository } from './ITagRepository';

/**
 * Prisma-backed implementation of the tag repository port.
 *
 * Driven adapter (secondary): called by the domain via ITagRepository.
 * Inject at the composition root — never instantiate inside services.
 */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieve all unique tags that appear on any article.
   *
   * Only returns tags that are actually linked to at least one article,
   * filtering out orphaned tag records.
   *
   * @returns Array of distinct tag name strings
   */
  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return tags.map((t) => t.name);
  }
}
