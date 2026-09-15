import type { PrismaClient } from '@prisma/client';
import type { ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** Lists unique tag names that are connected to at least one article. */
  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.database.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map((tag) => tag.name);
  }
}
