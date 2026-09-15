import type { PrismaClient } from '@prisma/client';
import type { ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Lists unique tag names that are attached to at least one article. */
  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.client.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map(({ name }) => name);
  }

  /** Replaces all tags attached to an article. */
  public async replaceArticleTags(articleId: string, tags: ReadonlyArray<string>): Promise<void> {
    await this.client.$transaction(async (transaction) => {
      await transaction.articleTag.deleteMany({ where: { articleId } });
      for (const name of new Set(tags)) {
        const tag = await transaction.tag.upsert({ where: { name }, create: { name }, update: {} });
        await transaction.articleTag.create({ data: { articleId, tagId: tag.id } });
      }
    });
  }
}
