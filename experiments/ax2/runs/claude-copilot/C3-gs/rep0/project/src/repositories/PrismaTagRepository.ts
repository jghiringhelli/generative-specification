import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

/**
 * Prisma-backed driven adapter for {@link ITagRepository}. Returns only tags
 * that appear on at least one article.
 */
export class PrismaTagRepository implements ITagRepository {
  /**
   * @param prisma - Shared Prisma client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findAll(): Promise<string[]> {
    const rows = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true }
    });
    return rows.map((r) => r.name);
  }
}
