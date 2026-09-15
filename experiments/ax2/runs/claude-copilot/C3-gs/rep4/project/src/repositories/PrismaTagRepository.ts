import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

/**
 * Prisma-backed driven adapter implementing {@link ITagRepository}.
 */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map((tag) => tag.name);
  }
}
