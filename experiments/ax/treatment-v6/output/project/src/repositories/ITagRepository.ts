/** Tag domain entity returned from repository operations. */
export interface Tag {
  readonly id: number;
  readonly name: string;
}

/**
 * Port interface for tag persistence operations.
 * Services depend on this interface; Prisma implementation is injected at composition root.
 */
export interface ITagRepository {
  /**
   * Find all tags that appear on any article.
   * @returns Array of all unique tag names.
   */
  findAll(): Promise<ReadonlyArray<string>>;

  /**
   * Create a tag if it does not already exist, return existing if it does.
   * @param name - The tag name.
   * @returns The tag entity (existing or newly created).
   */
  createIfNotExists(name: string): Promise<Tag>;

  /**
   * Find multiple tags by their names.
   * @param names - Array of tag names to find.
   * @returns Array of found tags.
   */
  findByNames(names: ReadonlyArray<string>): Promise<Tag[]>;
}
