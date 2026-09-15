const FALLBACK_SLUG = "article";
const SLUG_SEPARATOR = "-";

/** Generates a unique, readable article slug from a title and timestamp. */
export function generateSlug(title: string, timestamp = Date.now()): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, SLUG_SEPARATOR)
    .replace(/^-|-$/g, "");
  return `${base || FALLBACK_SLUG}${SLUG_SEPARATOR}${timestamp}`;
}
