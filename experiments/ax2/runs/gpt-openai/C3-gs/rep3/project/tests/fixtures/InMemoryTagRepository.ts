import { ITagRepository } from '../../src/repositories/ITagRepository';

export class InMemoryTagRepository implements ITagRepository {
  private readonly articleTags = new Map<string, ReadonlyArray<string>>();

  public constructor(entries: Readonly<Record<string, ReadonlyArray<string>>>) {
    Object.entries(entries).forEach(([articleId, tags]) => {
      this.articleTags.set(articleId, [...new Set(tags)]);
    });
  }

  public list(): Promise<ReadonlyArray<string>> {
    const tags = new Set([...this.articleTags.values()].flat());
    return Promise.resolve([...tags].sort());
  }

  public replaceArticleTags(
    articleId: string,
    tags: ReadonlyArray<string>,
  ): Promise<void> {
    this.articleTags.set(articleId, [...new Set(tags)]);
    return Promise.resolve();
  }

  public listByArticle(articleId: string): Promise<ReadonlyArray<string>> {
    return Promise.resolve(this.articleTags.get(articleId) ?? []);
  }
}
