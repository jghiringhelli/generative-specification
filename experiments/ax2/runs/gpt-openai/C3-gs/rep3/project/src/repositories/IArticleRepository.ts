export interface ArticleRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tagList: ReadonlyArray<string>;
  readonly author: {
    readonly id: string;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly followerIds: ReadonlyArray<string>;
  };
  readonly favoritedByIds: ReadonlyArray<string>;
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

export interface ArticleQuery {
  readonly tag?: string;
  readonly author?: string;
  readonly favoritedBy?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface IArticleRepository {
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>>;
  count(query: ArticleQuery): Promise<number>;
  feed(userId: string, limit: number, offset: number): Promise<ReadonlyArray<ArticleRecord>>;
  countFeed(userId: string): Promise<number>;
  create(data: CreateArticleRecord): Promise<ArticleRecord>;
  update(id: string, data: UpdateArticleRecord): Promise<ArticleRecord>;
  delete(id: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<void>;
  unfavorite(articleId: string, userId: string): Promise<void>;
}
