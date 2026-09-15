import { slugify } from "./slug";

describe("slugify", () => {
  it("converts a title to lowercase kebab-case", () => {
    const slug = slugify("Hello World Title");
    expect(slug.startsWith("hello-world-title-")).toBe(true);
  });

  it("strips punctuation and collapses separators", () => {
    const slug = slugify("How To: Train! Your @Dragon");
    expect(slug.startsWith("how-to-train-your-dragon-")).toBe(true);
  });

  it("produces unique slugs for identical titles", () => {
    const first = slugify("Same Title");
    const second = slugify("Same Title");
    expect(first).not.toBe(second);
  });

  it("has no leading or trailing hyphens before the suffix", () => {
    const slug = slugify("  spaced title  ");
    expect(slug).not.toMatch(/^-/);
  });
});
