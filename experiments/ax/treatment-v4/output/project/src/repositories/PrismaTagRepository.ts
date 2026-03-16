import { PrismaClient } from '@prisma/client';
import { ITagRepository, TagEntity } from './ITagRepository';

/**
 * Prisma implementation of tag repository.
 */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string): Promise<TagEntity | null> {
    return await this.prisma.tag.findUnique({
      where: { name }
    });
  }

  async upsert(name: string): Promise<TagEntity> {
    return await this.prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {}
    });
  }

  async upsertMany(names: string[]): Promise<TagEntity[]> {
    const tags: TagEntity[] = [];
    
    for (const name of names) {
      const tag = await this.upsert(name);
      tags.push(tag);
    }

    return tags;
  }

  async listAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true }
    });
    return tags.map(t => t.name);
  }
}
