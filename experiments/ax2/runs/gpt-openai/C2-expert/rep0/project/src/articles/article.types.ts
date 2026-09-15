import { ProfileResponse } from "../profiles/profile.types";

export type ArticleRecord = {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: number;
  readonly author: {
    readonly id: number;
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
  };
  readonly tags: ReadonlyArray<{ readonly name: string }>;
  readonly favorites: ReadonlyArray<{ readonly userId: number }>;
};

export type ArticleResponse = {
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
};

export type ArticleListItem = Omit<ArticleResponse, "body">;

export type ArticleFilters = {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
};

export type CreateArticleData = {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: ReadonlyArray<string>;
};

export type UpdateArticleData = Partial<CreateArticleData>;
