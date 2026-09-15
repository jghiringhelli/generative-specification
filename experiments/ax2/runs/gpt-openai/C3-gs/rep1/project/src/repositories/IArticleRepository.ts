export interface ArticleAuthorRecord {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface ArticleRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly author: ArticleAuthorRecord;
  readonly tagList: ReadonlyArray<string>;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ArticleFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favoritedBy?: string;
  readonly limit: number;
  readonly offset: number;
  readonly viewerId?: string;
}

export interface CreateArticleRecord {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly tagList: ReadonlyArray<string>;
}

export interface UpdateArticleRecord {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
}

export interface ArticleListResult {
  readonly articles: ReadonlyArray<ArticleRecord>;
  readonly count: number;
}

export interface IArticleRepository {
  findBySlug(slug: string, viewerId?: string): Promise<ArticleRecord | null>;
  list(filters: ArticleFilters): Promise<ArticleListResult>;
  feed(userId: string, limit: number, offset: number): Promise<ArticleListResult>;
  create(data: CreateArticleRecord): Promise<ArticleRecord>;
  update(id: string, data: UpdateArticleRecord, viewerId?: string): Promise<ArticleRecord>;
  delete(id: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<void>;
  unfavorite(articleId: string, userId: string): Promise<void>;
}
