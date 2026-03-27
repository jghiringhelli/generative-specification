/**
 * Utilities for constructing Conduit-spec error envelopes.
 *
 * The Conduit contract requires resource-scoped error responses — never generic
 * `errors.body`. Each domain produces errors under its own key:
 *   { errors: { [resource]: ["message", ...] } }
 *
 * @module formatError
 */

/**
 * Builds a resource-scoped error envelope for non-validation errors.
 *
 * @param resource - Domain resource name (e.g. 'article', 'profile', 'user')
 * @param messages - One or more error messages for this resource
 * @returns Conduit-compatible error envelope
 *
 * @example
 * formatError('article', ['not found'])
 * // => { errors: { article: ['not found'] } }
 */
export function formatError(
  resource: string,
  messages: string[],
): { errors: Record<string, string[]> } {
  return { errors: { [resource]: messages } };
}
