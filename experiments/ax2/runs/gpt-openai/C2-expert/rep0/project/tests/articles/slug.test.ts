import { createSlug } from "../../src/articles/slug";

describe("article slug generation", () => {
  it("converts a title to kebab case and appends the timestamp", () => {
    expect(createSlug("A Useful TypeScript Guide", 1723766400000))
      .toBe("a-useful-typescript-guide-1723766400000");
  });

  it("removes punctuation from generated slugs", () => {
    expect(createSlug("Hello, World!", 10)).toBe("hello-world-10");
  });
});
