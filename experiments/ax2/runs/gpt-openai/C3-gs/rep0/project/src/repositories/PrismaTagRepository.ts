import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async listUnique(): Promise<readonly string[]> {
    const tags = await this.database.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map(({ name }) => name);
  }
}
