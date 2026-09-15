/**
 * Persistence contract for tag queries.
 */
export interface ITagRepository {
  /**
   * Retrieves all unique tags stored in the system.
   *
   * @returns {Promise<readonly string[]>} List of tag names
   */
  findAllTags(): Promise<readonly string[]>;
}
