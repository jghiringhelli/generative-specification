/**
 * Tag repository port interface.
 * Defines data access contract for Tag entity.
 */
export interface ITagRepository {
  /**
   * Get all unique tag names.
   * @returns Array of tag names sorted alphabetically
   */
  getAllTags(): Promise<string[]>;
}
