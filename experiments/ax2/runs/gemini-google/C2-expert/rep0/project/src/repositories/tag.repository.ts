import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma.client';

export interface ITagRepository {
  findAllTags(): Promise<string[]>;
}

export class TagRepository implements ITagRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * Retrieves all unique tag names stored in the database.
   *
   * @returns {Promise<string[]>} List of tag names
   */
  public async findAllTags(): Promise<string[]> {
    const tags = await this.db.tag.findMany({
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map((t) => t.name);
  }
}
