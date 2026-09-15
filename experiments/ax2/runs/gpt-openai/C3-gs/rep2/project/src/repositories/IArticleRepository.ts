export interface ArticleRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly tagList: ReadonlyArray<string>;
}

export interface UpdateArticleData {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
}

export interface ArticleQuery {
  readonly tag?: string;
  readonly author?: string;
  readonly favoritedBy?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface IArticleRepository {
  create(data: CreateArticleData): Promise<ArticleRecord>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>>;
  count(query: ArticleQuery): Promise<number>;
  listFeed(userId: string, limit: number, offset: number): Promise<ReadonlyArray<ArticleRecord>>;
  countFeed(userId: string): Promise<number>;
  update(id: string, data: UpdateArticleData): Promise<ArticleRecord>;
  delete(id: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<void>;
  unfavorite(articleId: string, userId: string): Promise<void>;
  isFavorited(articleId: string, userId: string): Promise<boolean>;
  countFavorites(articleId: string): Promise<number>;
  getTags(articleId: string): Promise<ReadonlyArray<string>>;
}
