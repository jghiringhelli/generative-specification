import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

/**
 * Prisma-backed driven adapter implementing {@link ITagRepository}.
 */
export class PrismaTagRepository implements ITagRepository {
  private readonly prisma: PrismaClient;

  /**
   * @param prisma - Injected Prisma client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** @inheritdoc */
  async listAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
    });
    return tags.map((tag) => tag.name);
  }
}
