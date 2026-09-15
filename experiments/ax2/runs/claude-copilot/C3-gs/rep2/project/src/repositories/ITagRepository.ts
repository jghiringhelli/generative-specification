/**
 * Persistence port for tags.
 */
export interface ITagRepository {
  /**
   * Return every distinct tag that appears on any article.
   * @returns Sorted list of unique tag names.
   */
  listAll(): Promise<string[]>;
}
