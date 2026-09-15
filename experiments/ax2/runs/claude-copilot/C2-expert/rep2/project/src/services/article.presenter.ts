import { ArticleWithRelations } from '../repositories/article.repository';
import { CommentWithAuthor } from '../repositories/comment.repository';

interface AuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

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

export interface ArticleContext {
  currentUserId?: number;
  followingAuthorIds: ReadonlySet<number>;
  includeBody: boolean;
}

function buildAuthor(
  article: ArticleWithRelations,
  followingAuthorIds: ReadonlySet<number>
): AuthorView {
  return {
    username: article.author.username,
    bio: article.author.bio,
    image: article.author.image,
    following: followingAuthorIds.has(article.author.id)
  };
}

/**
 * Maps an article entity to its response view.
 * @param article the article with relations.
 * @param context viewer-specific state controlling favorited/following/body.
 * @returns the article view DTO.
 */
export function toArticleView(
  article: ArticleWithRelations,
  context: ArticleContext
): ArticleView {
  const favorited = context.currentUserId
    ? article.favorites.some((favorite) => favorite.userId === context.currentUserId)
    : false;
  const view: ArticleView = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: [...article.tagList].sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article._count.favorites,
    author: buildAuthor(article, context.followingAuthorIds)
  };
  if (context.includeBody) {
    view.body = article.body;
  }
  return view;
}

export interface CommentView {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: AuthorView;
}

/**
 * Maps a comment entity to its response view.
 * @param comment the comment with author.
 * @param followingAuthorIds ids the viewer follows.
 * @returns the comment view DTO.
 */
export function toCommentView(
  comment: CommentWithAuthor,
  followingAuthorIds: ReadonlySet<number>
): CommentView {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: followingAuthorIds.has(comment.author.id)
    }
  };
}
