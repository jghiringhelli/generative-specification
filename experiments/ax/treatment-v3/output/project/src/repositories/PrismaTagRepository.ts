import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

/**
 * Prisma implementation of ITagRepository.
 * Single responsibility: translate Tag domain operations to Prisma ORM calls.
 */
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAllTags(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map((tag) => tag.name);
  }
}
