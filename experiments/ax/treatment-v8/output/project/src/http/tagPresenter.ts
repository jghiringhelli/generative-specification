/**
 * Response presenter: maps the domain tag vocabulary to the RealWorld
 * `{ tags: [..] }` response envelope, keeping the domain shape off the wire.
 *
 * @gs-links: docs/specs/tags.md
 */

/** The RealWorld `{ tags: [..] }` response body. */
export interface TagListResponse {
  readonly tags: ReadonlyArray<string>;
}

/**
 * Shape the tag vocabulary for the wire.
 *
 * @param tags - the distinct tags across all articles.
 * @returns the RealWorld tag-list response envelope.
 */
export function toTagListResponse(tags: ReadonlyArray<string>): TagListResponse {
  return { tags };
}
