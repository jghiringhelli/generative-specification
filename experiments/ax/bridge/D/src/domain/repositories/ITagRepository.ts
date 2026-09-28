export interface ITagRepository {
  findAll(): Promise<string[]>;
  findOrCreate(name: string): Promise<number>;
}
