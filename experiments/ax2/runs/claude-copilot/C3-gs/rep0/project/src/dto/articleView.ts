import { ArticleEntity, UserEntity } from '../domain/types';

/**
 * The author sub-object embedded in an article response (a profile).
 */
export interface ArticleAuthorView {
  username: string;
  bio: string;
  image: string | null;
  following: boolean;
}

/**
 * A single article object in the Conduit response format. `body` is omitted in
 * list/feed responses (performance spec change 2024-08-16).
 */
export interface ArticleView {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthorView;
}

/**
 * Single-article response envelope.
 */
export interface ArticleResponse {
  article: ArticleView;
}

/**
 * Multi-article response envelope.
 */
export interface ArticleListResponse {
  articles: ArticleView[];
  articlesCount: number;
}

/**
 * Contextual flags needed to render an article for a specific viewer.
 */
export interface ArticleViewContext {
  author: UserEntity;
  favorited: boolean;
  following: boolean;
  includeBody: boolean;
}

/**
 * Build an {@link ArticleView} from an article entity and viewer context.
 * @param article - The article entity.
 * @param context - Author, favorite/follow flags, and body inclusion.
 * @returns The article view object.
 */
export function toArticleView(article: ArticleEntity, context: ArticleViewContext): ArticleView {
  const view: ArticleView = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: [...article.tagList].sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited: context.favorited,
    favoritesCount: article.favoritesCount,
    author: {
      username: context.author.username,
      bio: context.author.bio ?? '',
      image: context.author.image ?? null,
      following: context.following
    }
  };
  if (context.includeBody) {
    view.body = article.body;
  }
  return view;
}

/**
 * Wrap a single article view in its response envelope.
 * @param view - The article view.
 * @returns The single-article response.
 */
export function toArticleResponse(view: ArticleView): ArticleResponse {
  return { article: view };
}

/**
 * Build a multi-article response.
 * @param views - The article views (without body).
 * @param total - Total matching count before pagination.
 * @returns The list response.
 */
export function toArticleListResponse(views: ArticleView[], total: number): ArticleListResponse {
  return { articles: views, articlesCount: total };
}
