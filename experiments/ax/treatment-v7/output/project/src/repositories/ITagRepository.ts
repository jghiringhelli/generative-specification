/**
 * Port interface for tag retrieval operations.
 *
 * This interface is owned by the domain/service layer.
 * Implementations:
 *   - `PrismaTagRepository` — production (driven adapter using Prisma + PostgreSQL)
 *   - `InMemoryTagRepository` — test doubles (fast, no database required)
 *
 * Services depend on this interface, never on concrete implementations.
 * Inject implementations at the composition root.
 */
export interface ITagRepository {
  /**
   * Retrieve all unique tags used across published articles.
   *
   * @returns An array of distinct tag strings. Empty array if no articles have tags.
   *   Order is implementation-defined; callers should not assume alphabetical order
   *   unless the implementation documents it.
   */
  findAll(): Promise<string[]>;
}
