import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

/** PrismaClient-backed implementation of {@link ITagRepository}. */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map((t) => t.name);
  }
}
