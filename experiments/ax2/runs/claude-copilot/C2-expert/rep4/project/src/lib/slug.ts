/**
 * Convert an article title into a URL-safe slug and append a timestamp
 * suffix so that slugs remain unique even for duplicate titles.
 * @param title The article title.
 * @returns A kebab-case slug with a timestamp suffix.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
