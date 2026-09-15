export interface ITagRepository {
  getAllTags(): Promise<string[]>;
  findOrCreateTags(tagNames: string[]): Promise<string[]>;
}
