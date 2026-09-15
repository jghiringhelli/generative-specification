import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';
import { prisma as defaultPrisma } from '../config/prisma';

export class TagRepository implements ITagRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  async findAll(): Promise<string[]> {
    const tags = await this.db.tag.findMany({
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
}
