import { createSlug } from "../../src/articles/slug";

describe("article slug generation", () => {
  it("converts a title to kebab case and appends the timestamp", () => {
    expect(createSlug("Hello, TypeScript World!", 1723800000000))
      .toBe("hello-typescript-world-1723800000000");
  });

  it("removes accents when generating a slug", () => {
    expect(createSlug("Déjà Vu", 1)).toBe("deja-vu-1");
  });
});
