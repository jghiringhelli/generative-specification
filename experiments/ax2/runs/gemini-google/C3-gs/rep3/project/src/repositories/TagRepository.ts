// src/repositories/TagRepository.ts
import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

export class TagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findAll(): Promise<string[]> {
    // Return all unique tags that appear on any article
    const tags = await this.prisma.tag.findMany({
      where: {
        articles: {
          some: {}
        }
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map(t => t.name);
  }

  public async findOrCreateMany(tagNames: string[]): Promise<string[]> {
    const uniqueNames = Array.from(new Set(tagNames.map(t => t.trim()))).filter(Boolean);
    const results: string[] = [];

    for (const name of uniqueNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {}
      });
      results.push(tag.name);
    }

    return results;
  }
}
