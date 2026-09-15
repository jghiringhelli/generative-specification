import { generateSlug } from "../../src/articles/slug";

describe("article slug generation", () => {
  it("converts a title to kebab case and appends the timestamp", () => {
    expect(generateSlug("Hello, Real World!", 12345)).toBe("hello-real-world-12345");
  });

  it("removes accents from title characters", () => {
    expect(generateSlug("Déjà Vu", 12345)).toBe("deja-vu-12345");
  });

  it("uses a fallback when the title has no slug characters", () => {
    expect(generateSlug("---", 12345)).toBe("article-12345");
  });
});
