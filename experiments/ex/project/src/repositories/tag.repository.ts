import { PrismaClient, Tag } from '@prisma/client';

/**
 * Tag repository interface.
 */
export interface ITagRepository {
  findByName(name: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  upsertMany(tagNames: string[]): Promise<Tag[]>;
}

/**
 * Prisma implementation of tag repository.
 */
export class TagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { name }
    });
  }

  async findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async upsertMany(tagNames: string[]): Promise<Tag[]> {
    const uniqueNames = [...new Set(tagNames)];
    const tags: Tag[] = [];

    for (const name of uniqueNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {}
      });
      tags.push(tag);
    }

    return tags;
  }
}
