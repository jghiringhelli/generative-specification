export interface ArticleQuery {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly followerId?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface ArticleWrite {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: readonly string[];
}

export interface ArticleRecord extends ArticleWrite {
  readonly id: string;
  readonly slug: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IArticleRepository {
  list(query: ArticleQuery): Promise<{ articles: readonly ArticleRecord[]; count: number }>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  create(authorId: string, slug: string, input: ArticleWrite): Promise<ArticleRecord>;
  update(id: string, slug: string, input: Partial<ArticleWrite>): Promise<ArticleRecord>;
  delete(id: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<void>;
  unfavorite(articleId: string, userId: string): Promise<void>;
  isFavorited(articleId: string, userId: string): Promise<boolean>;
  favoriteCount(articleId: string): Promise<number>;
}
