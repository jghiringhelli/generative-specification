/** Creates a URL-safe, unique article slug. */
export function createSlug(title: string, timestamp = Date.now()): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${timestamp}`;
}
