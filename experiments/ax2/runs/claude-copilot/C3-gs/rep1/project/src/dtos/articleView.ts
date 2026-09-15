import { ArticleWithRelations } from '../repositories/IArticleRepository';

/**
 * Author sub-object embedded in article and comment views.
 */
export interface AuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/**
 * A single article payload. `body` is omitted from list responses.
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
  author: AuthorView;
}

/**
 * View-model inputs describing per-request state for an article.
 */
export interface ArticleViewContext {
  favorited: boolean;
  favoritesCount: number;
  following: boolean;
  includeBody: boolean;
}

/**
 * Build an article view, optionally omitting the body for list responses.
 * @param article - The article with author and tags loaded.
 * @param context - Per-request favorite/follow state and body inclusion flag.
 * @returns The Conduit article view.
 */
export function toArticleView(
  article: ArticleWithRelations,
  context: ArticleViewContext,
): ArticleView {
  const view: ArticleView = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tags.map((tag) => tag.name).sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited: context.favorited,
    favoritesCount: context.favoritesCount,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: context.following,
    },
  };
  if (context.includeBody) {
    view.body = article.body;
  }
  return view;
}
