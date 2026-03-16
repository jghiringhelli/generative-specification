
/**
 * Tag repository port interface.
 */
export interface ITagRepository {
  /**
   * Find tag by name.
   * @param name - Tag name
   * @returns Tag or null if not found
   */
  findByName(name: string): Promise<TagEntity | null>;

  /**
   * Find or create tag by name (upsert).
   * @param name - Tag name
   * @returns Tag entity
   */
  upsert(name: string): Promise<TagEntity>;

  /**
   * Find or create multiple tags.
   * @param names - Array of tag names
   * @returns Array of tag entities
   */
  upsertMany(names: string[]): Promise<TagEntity[]>;

  /**
   * Get all unique tags.
   * @returns Array of all tag names
   */
  listAll(): Promise<string[]>;
}

export interface TagEntity {
  id: number;
  name: string;
}
