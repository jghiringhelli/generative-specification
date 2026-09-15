import { articleListQuerySchema } from "../../src/articles/article.schemas";

describe("article pagination validation", () => {
  it("uses limit 20 and offset 0 when pagination is omitted", () => {
    expect(articleListQuerySchema.parse({})).toMatchObject({ limit: 20, offset: 0 });
  });

  it("coerces non-negative integer query strings", () => {
    expect(articleListQuerySchema.parse({ limit: "10", offset: "5" }))
      .toMatchObject({ limit: 10, offset: 5 });
  });

  it("rejects negative and fractional pagination values", () => {
    expect(() => articleListQuerySchema.parse({ limit: -1 })).toThrow();
    expect(() => articleListQuerySchema.parse({ offset: 1.5 })).toThrow();
  });
});
