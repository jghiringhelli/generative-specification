import { PrismaClient } from '@prisma/client';
import { ITagRepository } from '../ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Retrieves all unique tags that appear on any article.
   */
  async getAllTags(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        articles: {
          some: {},
        },
      },
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map((t) => t.name);
  }

  /**
   * Ensures tags exist and returns their names.
   */
  async findOrCreateTags(tagNames: string[]): Promise<string[]> {
    const unique = Array.from(new Set(tagNames));
    await Promise.all(
      unique.map((name) =>
        this.prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );
    return unique;
  }
}
