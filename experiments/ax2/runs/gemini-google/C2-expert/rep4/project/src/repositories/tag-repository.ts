import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma';
import { ITagRepository } from './tag-repository.interface';

/**
 * Prisma implementation of the Tag repository.
 */
export class TagRepository implements ITagRepository {
  private readonly db: PrismaClient;

  /**
   * Constructs the TagRepository.
   *
   * @param {PrismaClient} [dbClient=defaultPrisma] - Injected Prisma client
   */
  constructor(dbClient: PrismaClient = defaultPrisma) {
    this.db = dbClient;
  }

  /**
   * Retrieves all unique tags stored across articles.
   *
   * @returns {Promise<readonly string[]>} List of tag strings
   */
  public async findAllTags(): Promise<readonly string[]> {
    const tags = await this.db.tag.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map((t) => t.name);
  }
}
