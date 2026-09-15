import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Lists unique tag names that are attached to at least one article. */
  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.client.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return tags.map((tag) => tag.name);
  }
}
