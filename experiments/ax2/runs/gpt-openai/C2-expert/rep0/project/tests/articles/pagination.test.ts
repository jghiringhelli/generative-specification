import {
  articleListSchema,
  DEFAULT_ARTICLE_LIMIT,
  DEFAULT_ARTICLE_OFFSET
} from "../../src/articles/article.schemas";

describe("article pagination validation", () => {
  it("uses the documented pagination defaults", () => {
    const result = articleListSchema.parse({});
    expect(result.limit).toBe(DEFAULT_ARTICLE_LIMIT);
    expect(result.offset).toBe(DEFAULT_ARTICLE_OFFSET);
  });

  it("accepts non-negative integer pagination values", () => {
    expect(articleListSchema.parse({ limit: "5", offset: "10" }))
      .toMatchObject({ limit: 5, offset: 10 });
  });

  it.each([{ limit: "-1" }, { offset: "-1" }, { limit: "1.5" }, { offset: "invalid" }])(
    "rejects invalid pagination values: %o",
    (query) => {
      expect(() => articleListSchema.parse(query)).toThrow();
    }
  );
});
