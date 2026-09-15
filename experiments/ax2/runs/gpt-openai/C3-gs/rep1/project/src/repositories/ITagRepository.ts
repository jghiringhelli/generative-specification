export interface ITagRepository {
  list(): Promise<ReadonlyArray<string>>;
  replaceArticleTags(articleId: string, tags: ReadonlyArray<string>): Promise<void>;
}
