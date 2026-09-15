import {
  articleListQuerySchema,
  articlePaginationSchema
} from "../../src/articles/article.schemas";

describe("article pagination validation", () => {
  it("uses limit 20 and offset 0 when pagination is omitted", () => {
    expect(articlePaginationSchema.parse({})).toEqual({ limit: 20, offset: 0 });
  });

  it("coerces non-negative integer query strings", () => {
    expect(articleListQuerySchema.parse({ limit: "10", offset: "5" })).toMatchObject({
      limit: 10,
      offset: 5
    });
  });

  it("rejects negative and fractional pagination values", () => {
    expect(articlePaginationSchema.safeParse({ limit: -1, offset: 0 }).success).toBe(false);
    expect(articlePaginationSchema.safeParse({ limit: 1, offset: 0.5 }).success).toBe(false);
  });
});
