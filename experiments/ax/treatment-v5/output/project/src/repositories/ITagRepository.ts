
/**
 * Tag repository interface.
 * Defines the contract for tag data access operations.
 */

export interface ITag {
  id: number;
  name: string;
}

export interface ITagRepository {
  /**
   * Get all unique tags that have been used in at least one article.
   * @returns List of tag names (strings)
   */
  listAll(): Promise<string[]>;

  /**
   * Upsert tags by name.
   * Creates tags if they don't exist, returns existing if they do.
   * @param tagNames - Array of tag names to upsert
   * @returns Created/found Tag records
   */
  upsertMany(tagNames: string[]): Promise<ITag[]>;

  /**
   * Find tag by exact name match.
   * @returns Tag if found, null otherwise
   */
  findByName(name: string): Promise<ITag | null>;
}
