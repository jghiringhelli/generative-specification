export interface ITagRepository {
  findAll(): Promise<string[]>;
}
