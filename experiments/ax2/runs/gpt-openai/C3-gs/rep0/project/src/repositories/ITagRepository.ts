export interface ITagRepository {
  listUnique(): Promise<readonly string[]>;
}
