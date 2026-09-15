/**
 * Persistence port for tags. Tags are derived from articles; this port
 * exposes the set of all tags currently in use.
 */
export interface ITagRepository {
  /**
   * Return all unique tag names that appear on any article.
   * @returns Array of distinct tag names.
   */
  findAll(): Promise<string[]>;
}
