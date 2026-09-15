import { ProfileResponse } from '../profiles/contracts';

export interface CreateArticleCommand {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: ReadonlyArray<string>;
}

export interface UpdateArticleCommand {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
}

export interface ListArticlesQuery {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface ArticleResponse {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ProfileResponse;
}

export type ArticleListItem = Omit<ArticleResponse, 'body'>;

export interface ArticleListResponse {
  readonly articles: ReadonlyArray<ArticleListItem>;
  readonly articlesCount: number;
}
