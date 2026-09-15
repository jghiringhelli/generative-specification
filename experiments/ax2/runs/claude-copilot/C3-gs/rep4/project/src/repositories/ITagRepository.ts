/**
 * Persistence port for tags.
 */
export interface ITagRepository {
  /** Return every distinct tag name that appears on any article. */
  findAll(): Promise<string[]>;
}
