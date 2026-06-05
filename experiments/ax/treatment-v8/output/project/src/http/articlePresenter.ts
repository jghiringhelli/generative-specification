/**
 * Response presenters: map the domain {@link ArticleView} to the RealWorld
 * `article` / `articles` response envelopes, keeping the domain shape off the
 * wire and rendering dates as ISO-8601 strings.
 *
 * Per the 2024-08-16 performance spec, the list and feed envelopes omit the
 * heavyweight `body` field; only the single-article envelope carries it.
 *
 * @gs-links: docs/specs/articles.md
 */
import type { ArticleAuthorView, ArticleView } from '../services/ArticleService.js';

/** The embedded author object shared by both envelopes. */
interface AuthorPayload {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** A list/feed article: the full article minus `body`. */
interface ArticleSummaryPayload {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: AuthorPayload;
}

/** A single article: the summary plus the `body`. */
interface ArticlePayload extends ArticleSummaryPayload {
  readonly body: string;
}

/** The RealWorld `{ article: {..} }` response body. */
export interface ArticleResponse {
  readonly article: ArticlePayload;
}

/** The RealWorld `{ articles: [..], articlesCount }` response body. */
export interface ArticleListResponse {
  readonly articles: ReadonlyArray<ArticleSummaryPayload>;
  readonly articlesCount: number;
}

/** Shape a single article (with `body`) for the wire. */
export function toArticleResponse(view: ArticleView): ArticleResponse {
  return { article: { ...toSummary(view), body: view.body } };
}

/** Shape a page of articles (without `body`) for the wire. */
export function toArticleListResponse(
  views: ReadonlyArray<ArticleView>,
  articlesCount: number,
): ArticleListResponse {
  return { articles: views.map(toSummary), articlesCount };
}

/** Project the shared, body-less summary fields. */
function toSummary(view: ArticleView): ArticleSummaryPayload {
  return {
    slug: view.slug,
    title: view.title,
    description: view.description,
    tagList: view.tagList,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    favorited: view.favorited,
    favoritesCount: view.favoritesCount,
    author: toAuthor(view.author),
  };
}

/** Project the embedded author profile. */
function toAuthor(author: ArticleAuthorView): AuthorPayload {
  return {
    username: author.username,
    bio: author.bio,
    image: author.image,
    following: author.following,
  };
}
