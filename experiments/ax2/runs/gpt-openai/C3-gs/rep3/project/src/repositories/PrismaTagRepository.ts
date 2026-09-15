import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.client.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return tags.map((tag) => tag.name);
  }

  public async replaceArticleTags(
    articleId: string,
    tags: ReadonlyArray<string>,
  ): Promise<void> {
    await this.client.$transaction(async (transaction) => {
      await transaction.articleTag.deleteMany({ where: { articleId } });
      for (const name of new Set(tags)) {
        await transaction.articleTag.create({
          data: {
            articleId,
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          },
        });
      }
    });
  }

  public async listByArticle(
    articleId: string,
  ): Promise<ReadonlyArray<string>> {
    const tags = await this.client.articleTag.findMany({
      where: { articleId },
      select: { tagName: true },
      orderBy: { tagName: 'asc' },
    });
    return tags.map((tag) => tag.tagName);
  }
}
