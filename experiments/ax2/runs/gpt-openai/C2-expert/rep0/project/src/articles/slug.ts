const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const EDGE_HYPHEN_PATTERN = /^-|-$/g;

/** Generates a unique, readable article slug from a title and timestamp. */
export function createSlug(title: string, timestamp = Date.now()): string {
  const titleSegment = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(NON_ALPHANUMERIC_PATTERN, "-")
    .replace(EDGE_HYPHEN_PATTERN, "");
  return `${titleSegment}-${timestamp}`;
}
