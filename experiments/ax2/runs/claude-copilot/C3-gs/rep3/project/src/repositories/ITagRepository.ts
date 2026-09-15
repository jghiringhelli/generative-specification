/**
 * Persistence contract for article tags.
 */
export interface ITagRepository {
  /** Return the distinct set of tag names used across all articles. */
  findAll(): Promise<string[]>;
}
