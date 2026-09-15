/**
 * Persistence port for tag operations.
 */
export interface ITagRepository {
  /**
   * List all distinct tag names that appear on any article.
   * @returns Array of tag names.
   */
  findAll(): Promise<string[]>;

  /**
   * Upsert a set of tags by name, returning nothing.
   * @param names - Tag names to ensure exist.
   */
  ensure(names: string[]): Promise<void>;
}
