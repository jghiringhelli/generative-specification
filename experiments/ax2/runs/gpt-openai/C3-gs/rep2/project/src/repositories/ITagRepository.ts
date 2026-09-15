export interface ITagRepository {
  list(): Promise<ReadonlyArray<string>>;
}
