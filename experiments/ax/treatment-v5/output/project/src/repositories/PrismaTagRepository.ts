
/**
 * Prisma implementation of ITagRepository.
 * Handles tag creation and retrieval.
 */

import { PrismaClient } from '@prisma/client';
import type { ITag, ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true },
      distinct: ['name']
    });
    return tags.map((tag) => tag.name);
  }

  async upsertMany(tagNames: string[]): Promise<ITag[]> {
    // Remove duplicates and empty strings
    const uniqueNames = [...new Set(tagNames.filter((name) => name.trim().length > 0))];

    if (uniqueNames.length === 0) {
      return [];
    }

    // Upsert each tag
    const tags = await Promise.all(
      uniqueNames.map((name) =>
        this.prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name }
        })
      )
    );

    return tags;
  }

  async findByName(name: string): Promise<ITag | null> {
    return await this.prisma.tag.findUnique({
      where: { name }
    });
  }
}
