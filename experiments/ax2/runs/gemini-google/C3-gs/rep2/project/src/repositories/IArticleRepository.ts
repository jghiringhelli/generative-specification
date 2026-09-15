export interface AuthorProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleEntity {
  id: string;
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

export interface IArticleRepository {
  findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null>;
  findAll(filters: ArticleFilters, currentUserId?: string): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  findFeed(currentUserId: string, pagination: { limit?: number; offset?: number }): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  create(data: CreateArticleData): Promise<ArticleEntity>;
  update(slug: string, data: UpdateArticleData, currentUserId?: string): Promise<ArticleEntity>;
  delete(slug: string, currentUserId: string): Promise<void>;
  favorite(slug: string, userId: string): Promise<ArticleEntity>;
  unfavorite(slug: string, userId: string): Promise<ArticleEntity>;
}
