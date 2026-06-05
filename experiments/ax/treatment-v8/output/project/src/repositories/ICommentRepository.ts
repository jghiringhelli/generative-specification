/**
 * Port: persistence boundary for Comment entities on articles.
 *
 * Concrete adapters are injected at the composition root. The adapter stays
 * ignorant of users and the follow graph: a comment references its author by id,
 * and the service resolves that id to the embedded author profile. Deletion is a
 * soft delete (operation-classification Tier 3: no hard delete of domain
 * entities); every read excludes soft-deleted rows, so they are unobservable.
 *
 * @gs-links: docs/specs/comments.md
 */

/** A persisted comment in domain terms. */
export interface Comment {
  /** Auto-incrementing integer identity (RealWorld comment ids are integers). */
  readonly id: number;
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Fields required to create a comment. */
export interface NewComment {
  readonly body: string;
  readonly articleId: string;
  readonly authorId: string;
}

export interface ICommentRepository {
  create(input: NewComment): Promise<Comment>;
  /** Find a live (non-deleted) comment by id, or `null`. */
  findById(id: number): Promise<Comment | null>;
  /** Live comments on an article, newest first. */
  listByArticle(articleId: string): Promise<ReadonlyArray<Comment>>;
  /** Soft-delete by id (Tier 3: no hard delete); excluded from all reads after. */
  delete(id: number): Promise<void>;
}
