import type { PrismaClient } from '@prisma/client';
import type { ITagRepository, Tag } from './ITagRepository.js';

/**
 * Prisma-backed implementation of ITagRepository.
 * §9 check: implements findAll, createIfNotExists, findByNames.
 */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findAll(): Promise<ReadonlyArray<string>> {
    const tags = await this.prisma.tag.findMany({
      where: {
        articles: { some: {} },
      },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map((t) => t.name);
  }

  /** @inheritdoc */
  async createIfNotExists(name: string): Promise<Tag> {
    return this.prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  /** @inheritdoc */
  async findByNames(names: ReadonlyArray<string>): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { name: { in: [...names] } },
    });
  }
}
