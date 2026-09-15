import { ArticleWithRelations } from './article.repository';

/** Serialized author profile embedded in article responses. */
export interface ArticleAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/** Serialized article object (RealWorld `article`). */
export interface ArticleDto {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthor;
}

/** Options controlling article serialization. */
export interface SerializeOptions {
  currentUserId?: number;
  following: boolean;
  includeBody: boolean;
}

/**
 * Maps an article entity to the API DTO.
 * @param article the article with relations
 * @param options serialization options (viewer, following, body inclusion)
 * @returns the serialized article DTO
 */
export function serializeArticle(
  article: ArticleWithRelations,
  options: SerializeOptions,
): ArticleDto {
  const favorited = options.currentUserId
    ? article.favoritedBy.some((user) => user.id === options.currentUserId)
    : false;

  const dto: ArticleDto = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article._count.favoritedBy,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: options.following,
    },
  };

  if (options.includeBody) {
    dto.body = article.body;
  }

  return dto;
}
